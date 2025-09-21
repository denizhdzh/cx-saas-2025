import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { processDocument, fileToBase64 } from '../utils/firebaseFunctions';
import { 
  DocumentArrowUpIcon, 
  SparklesIcon, 
  DocumentTextIcon, 
  ArrowLeftIcon, 
  CpuChipIcon,
  PaintBrushIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  PaintBucket, 
  Palette, 
  Moon, 
  Sun, 
  Swatches, 
  Eye 
} from 'phosphor-react';

export default function EditAgentPage() {
  const { selectedAgent, updateAgent } = useAgent();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('training');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const [instructions, setInstructions] = useState('');
  
  // Customization states
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('gray');
  const [chatbotStyle, setChatbotStyle] = useState('modern');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedAgent) {
      window.location.href = '/dashboard';
      return;
    }

    // Set initial instructions
    setInstructions(`### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.`);
  }, [selectedAgent]);

  useEffect(() => {
    const fetchCustomization = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setTheme(data.theme || 'light');
            setAccentColor(data.accentColor || 'gray');
            setChatbotStyle(data.chatbotStyle || 'modern');
          }
        } catch (error) {
          console.error('Error fetching customization:', error);
        }
      }
    };

    fetchCustomization();
  }, [user]);

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      status: 'ready', // ready, processing, completed, error
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Update agent training status
      await updateAgent(selectedAgent.id, {
        trainingStatus: 'training'
      });

      // Mark files as processing
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'processing',
        progress: 0
      })));

      let completedCount = 0;
      const totalFiles = uploadedFiles.length;

      // Process each file
      for (const file of uploadedFiles) {
        try {
          // Convert file to base64
          const base64Content = await fileToBase64(file.file);
          
          // Update progress for this file
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress: 25 } : f
          ));

          // Call Firebase Function to process document
          const result = await processDocument({
            agentId: selectedAgent.id,
            fileName: file.name,
            fileContent: base64Content,
            fileType: file.file.type
          });

          // Update progress
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress: 75 } : f
          ));

          if (result.data.success) {
            // Mark as completed
            setUploadedFiles(prev => prev.map(f => 
              f.id === file.id ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                documentId: result.data.documentId
              } : f
            ));
            completedCount++;
          } else {
            throw new Error('Processing failed');
          }

        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'error', progress: 0 } : f
          ));
        }
      }

      setIsProcessing(false);

      // Update agent with final status
      if (completedCount > 0) {
        await updateAgent(selectedAgent.id, {
          trainingStatus: 'trained',
          documentCount: (selectedAgent.documentCount || 0) + completedCount
        });
        
        alert(`Successfully processed ${completedCount}/${totalFiles} documents!`);
      } else {
        await updateAgent(selectedAgent.id, {
          trainingStatus: 'not_trained'
        });
        alert('No documents were processed successfully.');
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
      setIsProcessing(false);
      
      await updateAgent(selectedAgent.id, {
        trainingStatus: 'not_trained'
      });
      
      alert('Error processing documents: ' + error.message);
    }
  };

  const updateSetting = async (field, value) => {
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          [field]: value
        });
      } catch (error) {
        console.error('Error updating setting:', error);
      }
    }
  };

  const SettingSection = ({ icon: Icon, title, children }) => (
    <div className="border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  const ColorOption = ({ color, isSelected, onClick }) => (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-lg border-2 transition-all ${
        isSelected ? 'border-gray-900 scale-110' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ 
        backgroundColor: color === 'gray' ? '#6b7280' : 
                        color === 'blue' ? '#3b82f6' :
                        color === 'green' ? '#10b981' :
                        color === 'purple' ? '#8b5cf6' :
                        color === 'red' ? '#ef4444' : '#6b7280'
      }}
    />
  );

  if (!selectedAgent) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">No agent selected. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit {selectedAgent.name} - Orchis</title>
        <meta name="description" content="Edit and customize your AI assistant" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 flex h-screen">
          {/* Left Panel */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors text-xs cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Back to Dashboard
              </button>
              <div className="text-xs text-gray-400 mb-1">Editing</div>
              <h1 className="text-lg font-medium text-gray-900">{selectedAgent.name}</h1>
              
              {/* Tabs */}
              <div className="mt-4 flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('training')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'training' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Training & Data
                </button>
                <button
                  onClick={() => setActiveTab('customize')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'customize' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <PaintBrushIcon className="w-4 h-4" />
                  Customize
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {activeTab === 'training' && (
                <>
                  {/* Agent Configuration */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Agent Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">Name</label>
                        <input
                          type="text"
                          value={selectedAgent.name}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors bg-gray-50"
                          disabled
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={selectedAgent.type}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors cursor-pointer bg-gray-50"
                          disabled
                        >
                          <option value="customer_support">Customer Support</option>
                          <option value="sales">Sales Assistant</option>
                          <option value="technical">Technical Support</option>
                          <option value="general">General Assistant</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">Agent status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedAgent?.trainingStatus === 'trained' ? 'bg-green-100 text-green-800' :
                          selectedAgent?.trainingStatus === 'training' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedAgent?.trainingStatus === 'trained' ? 'Trained' : 
                           selectedAgent?.trainingStatus === 'training' ? 'Training' : 'Not Trained'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">Temperature</label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">{temperature.toFixed(1)}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                          />
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Reserved</span>
                            <span>Creative</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-900 mb-2">Instructions</label>
                        <textarea
                          className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-gray-900 transition-colors resize-none font-mono bg-white"
                          rows={12}
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload Documents */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Training Documents</h3>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        isDragging 
                          ? 'border-gray-400 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <DocumentArrowUpIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        Drop files or click to upload
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        PDF, TXT, DOCX (max 10MB)
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs cursor-pointer font-medium"
                      >
                        Select Files
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.docx"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                    </div>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h3>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DocumentTextIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-900 truncate">{file.name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                {file.status === 'processing' && (
                                  <div className="mt-1 w-20">
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                      <div 
                                        className="bg-gray-900 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${file.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-1 ${
                                  file.status === 'ready' ? 'bg-gray-100 text-gray-800' :
                                  file.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  file.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {file.status === 'ready' ? 'Ready' :
                                   file.status === 'processing' ? 'Processing...' :
                                   file.status === 'completed' ? 'Done' :
                                   'Error'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(file.id)}
                              className="text-xs text-red-600 hover:text-red-700 transition-colors cursor-pointer p-1 hover:bg-red-50 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Training Button */}
                  <div>
                    {isProcessing ? (
                      <div className="text-center py-3">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900"></div>
                          <span className="text-gray-700 text-xs">Training AI...</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={processFiles}
                        disabled={uploadedFiles.length === 0 || uploadedFiles.some(f => f.status === 'processing')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer font-medium"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        Add Training Data
                      </button>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'customize' && (
                <div className="space-y-6">
                  {/* Theme */}
                  <SettingSection icon={Palette} title="Theme">
                    <SettingRow 
                      label="Interface Theme"
                      description="Choose your preferred interface theme"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTheme('light');
                            updateSetting('theme', 'light');
                          }}
                          className={`p-2 rounded-md transition-colors ${
                            theme === 'light' ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Sun size={14} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            setTheme('dark');
                            updateSetting('theme', 'dark');
                          }}
                          className={`p-2 rounded-md transition-colors ${
                            theme === 'dark' ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Moon size={14} className="text-gray-600" />
                        </button>
                      </div>
                    </SettingRow>
                  </SettingSection>

                  {/* Colors */}
                  <SettingSection icon={Swatches} title="Colors">
                    <SettingRow 
                      label="Accent Color"
                      description="Primary accent color for buttons and highlights"
                    >
                      <div className="flex items-center gap-2">
                        {['gray', 'blue', 'green', 'purple', 'red'].map(color => (
                          <ColorOption
                            key={color}
                            color={color}
                            isSelected={accentColor === color}
                            onClick={() => {
                              setAccentColor(color);
                              updateSetting('accentColor', color);
                            }}
                          />
                        ))}
                      </div>
                    </SettingRow>
                  </SettingSection>

                  {/* Chatbot Appearance */}
                  <SettingSection icon={PaintBucket} title="Chatbot Style">
                    <SettingRow 
                      label="Chat Interface Style"
                      description="Choose how your chatbot interface appears"
                    >
                      <select
                        value={chatbotStyle}
                        onChange={(e) => {
                          setChatbotStyle(e.target.value);
                          updateSetting('chatbotStyle', e.target.value);
                        }}
                        className="text-sm border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </SettingRow>
                    <SettingRow 
                      label="Chat Bubble Style"
                      description="Appearance of individual chat messages"
                    >
                      <select
                        className="text-sm border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        defaultValue="rounded"
                      >
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                        <option value="pill">Pill</option>
                      </select>
                    </SettingRow>
                  </SettingSection>

                  {/* Preview */}
                  <SettingSection icon={Eye} title="Preview">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="text-sm font-medium text-gray-900 mb-4">Live Preview</div>
                      <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-md">
                        {/* Mini chatbot preview */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                          <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                          <span className="text-xs font-medium">Preview Bot</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-gray-100 rounded-lg p-2 max-w-xs">
                            <div className="text-xs">Hello! How can I help you?</div>
                          </div>
                          <div className="bg-gray-900 text-white rounded-lg p-2 max-w-xs ml-auto">
                            <div className="text-xs">This is a preview message</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                          <input 
                            className="flex-1 text-xs bg-transparent outline-none" 
                            placeholder="Type a message..." 
                            disabled
                          />
                          <button className="text-xs text-gray-500">Send</button>
                        </div>
                      </div>
                    </div>
                  </SettingSection>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chatbot Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-medium text-gray-900">Live Preview</h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedAgent?.trainingStatus === 'trained' ? 'Chat with your trained agent' : 
                 'Train your agent to enable chat preview'}
              </p>
            </div>

            {/* Chat Preview Area */}
            <div className="flex-1 flex flex-col">
              {selectedAgent?.trainingStatus !== 'trained' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <CpuChipIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Agent Not Ready</div>
                    <div className="text-xs text-gray-500 max-w-xs">
                      Train your agent with documents to enable the chat preview
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center overflow-hidden">
                  <main className="z-20 h-full w-full items-center justify-center md:mx-auto md:my-auto md:max-h-[45rem] md:max-w-[25.5rem]">
                    <div className="flex h-[80vh] w-full flex-col justify-center md:h-full">
                      <div className="flex h-full w-full flex-col">
                        <div className="h-full w-full overflow-hidden border-[1px] border-zinc-100 md:rounded-[20px]">
                          <main className="group relative flex h-full flex-col bg-white shadow-sm backdrop-blur-sm">
                            {/* Header */}
                            <header className="relative flex items-center justify-between px-5 text-black bg-white">
                              <div className="my-4 flex h-10 items-center">
                                <div className="flex flex-col justify-center gap-px">
                                  <h1 className="font-medium text-sm tracking-tight">{selectedAgent?.name || 'Agent'}</h1>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm transition-all duration-200 h-9 w-9 rounded-md p-1.5 text-inherit opacity-70 hover:opacity-85">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="p-0.5 transition-transform duration-700 ease-in-out hover:rotate-180">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                    <path d="M21 3v5h-5"></path>
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                    <path d="M8 16H3v5"></path>
                                  </svg>
                                </button>
                              </div>
                            </header>

                            {/* Messages Container */}
                            <div className="-mb-2 relative flex-1 basis-full overflow-y-hidden scroll-smooth flex flex-col shadow-inner">
                              <div className="flex w-full flex-1 flex-col space-y-3 overflow-y-auto px-5 pt-5">
                                <div className="flex flex-1 flex-col gap-5">
                                  <div className="relative flex w-full max-w-full flex-col items-baseline gap-1">
                                    <div className="group/message relative w-full">
                                      <div className="flex w-full">
                                        <div className="group/message flex w-full flex-col items-start gap-1 min-h-full">
                                          <div className="relative w-full max-w-[min(calc(100%-40px),65ch)] pr-3">
                                            <div className="max-w-full overflow-hidden">
                                              <div className="hyphens-auto whitespace-normal text-wrap break-words text-left text-sm leading-5 antialiased relative flex w-fit max-w-full flex-col items-start gap-2 px-4 py-3 bg-zinc-200/50 text-zinc-800 rounded-[20px]">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-sm text-zinc-950 leading-normal tracking-tight">{selectedAgent?.name || 'Agent'}</span>
                                                </div>
                                                <div className="w-full text-sm text-zinc-800 leading-normal tracking-tight">
                                                  <p>Hi! What can I help you with?</p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Input Area */}
                            <div className="relative z-50 flex shrink-0 flex-col justify-end">
                              <div className="mt-0.5 mb-4 items-center justify-center gap-2 bg-white text-xs text-zinc-400">
                                <p className="flex items-center justify-center shrink-0">
                                  <span className="ml-1">Powered by Orchis</span>
                                </p>
                              </div>
                              <div className="flex-row items-center px-4 py-2.5 relative z-50 mx-4 mb-4 flex min-h-13 rounded-2xl bg-white border-[1.5px] border-zinc-100 shadow-sm focus-within:border-[1.5px] focus-within:border-zinc-950">
                                <textarea 
                                  className="flex w-full rounded-md bg-transparent text-base transition-color max-h-40 min-h-5 resize-none border-0 px-1 py-0 outline-none text-zinc-950 placeholder:text-zinc-400 text-sm flex-1"
                                  placeholder="Message..."
                                  rows="1"
                                  disabled
                                />
                                <div className="flex flex-row gap-1">
                                  <button className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm transition-all duration-200 rounded-md p-1.5 h-7 w-7 bg-transparent shadow-none hover:bg-zinc-100/90" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" className="size-5 text-zinc-700">
                                      <path stroke="#71717A" d="M7.5 8.333v.834m5-.834v.834m-5.476 2.916A4.154 4.154 0 0 0 10 13.333c1.165 0 2.22-.478 2.976-1.25M10 17.625a7.625 7.625 0 1 1 0-15.25 7.625 7.625 0 0 1 0 15.25Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <button className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm transition-all duration-200 rounded-md p-1.5 h-7 w-7 bg-transparent shadow-none hover:bg-zinc-100/90" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="size-5 text-zinc-700">
                                      <path fill="currentColor" d="M15.44 1.68c.69-.05 1.47.08 2.13.74.66.67.8 1.45.75 2.14-.03.47-.15 1-.25 1.4l-.09.35a43.7 43.7 0 0 1-3.83 10.67A2.52 2.52 0 0 1 9.7 17l-1.65-3.03a.83.83 0 0 1 .14-1l3.1-3.1a.83.83 0 1 0-1.18-1.17l-3.1 3.1a.83.83 0 0 1-.99.14L2.98 10.3a2.52 2.52 0 0 1 .04-4.45 43.7 43.7 0 0 1 11.02-3.9c.4-.1.92-.23 1.4-.26Z"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </main>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}