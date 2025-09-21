import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import { useAgent } from '../contexts/AgentContext';
import { processDocument, fileToBase64 } from '../utils/firebaseFunctions';
import { FileText, UploadSimple, Sparkle, User, BookOpen } from 'phosphor-react';

export default function CreateAgentPage() {
  const { createAgent, updateAgent } = useAgent();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    type: 'customer_support'
  });
  const fileInputRef = useRef(null);

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

  const handleCreateAndTrain = async () => {
    if (!newAgent.name) {
      alert('Please enter agent name');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create the agent first
      const createdAgent = await createAgent({
        ...newAgent,
        description: `${newAgent.name} - AI Assistant`
      });

      // Update agent training status
      await updateAgent(createdAgent.id, {
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
            agentId: createdAgent.id,
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
        await updateAgent(createdAgent.id, {
          trainingStatus: 'trained',
          documentCount: completedCount
        });
        
        alert(`Successfully created and trained ${newAgent.name}!`);
        // Redirect to configuration page
        window.location.href = '/configuration';
      } else {
        await updateAgent(createdAgent.id, {
          trainingStatus: 'not_trained'
        });
        alert('Agent created but no documents were processed successfully.');
        window.location.href = '/configuration';
      }
      
    } catch (error) {
      console.error('Error creating and training agent:', error);
      setIsProcessing(false);
      alert('Error creating agent: ' + error.message);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create New Agent - Orchis</title>
        <meta name="description" content="Create and train a new AI assistant" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-900 mb-4 transition-colors text-xs cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <div className="text-xs text-neutral-400 mb-2">Create</div>
              <h1 className="text-2xl font-thin text-neutral-900">New AI Agent</h1>
              <div className="w-12 h-px bg-neutral-900 mt-4"></div>
            </div>

            <div className="max-w-7xl">
              <div className="grid grid-cols-2 gap-12">
                
                {/* Left Side - Agent Setup */}
                <div className="space-y-6">
                  {/* Agent Details */}
                  <div className="card">
                    <div className="card-header">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-500 rounded-lg">
                          <User size={16} className="text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-neutral-900">Agent Details</h3>
                      </div>
                    </div>
                    <div className="card-content space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-neutral-900">Name</div>
                          <div className="text-xs text-neutral-600 mt-0.5">This will be your agent's display name</div>
                        </div>
                        <div className="ml-4 flex-1 max-w-xs">
                          <input
                            type="text"
                            value={newAgent.name}
                            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                            className="form-input"
                            placeholder="e.g., Customer Support Assistant"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-neutral-900">Type</div>
                          <div className="text-xs text-neutral-600 mt-0.5">Choose the agent's specialization</div>
                        </div>
                        <div className="ml-4">
                          <select
                            value={newAgent.type}
                            onChange={(e) => setNewAgent({ ...newAgent, type: e.target.value })}
                            className="form-select"
                          >
                            <option value="customer_support">Customer Support</option>
                            <option value="sales">Sales Assistant</option>
                            <option value="technical">Technical Support</option>
                            <option value="general">General Assistant</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Training Documents */}
                  <div className="card">
                    <div className="card-header">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-900 rounded-lg">
                          <BookOpen size={16} className="text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-neutral-900">Training Documents</h3>
                      </div>
                    </div>
                    <div className="card-content">
                      {/* Upload Area */}
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                          isDragging 
                            ? 'border-orange-900 bg-orange-900/10 scale-[1.02]' 
                            : 'border-neutral-300 hover:border-orange-900 hover:bg-orange-900/5 hover:scale-[1.01]'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={`transition-all duration-300 ${isDragging ? 'scale-110' : ''}`}>
                          <UploadSimple size={36} className={`mx-auto mb-4 ${isDragging ? 'text-orange-900' : 'text-neutral-400'}`} />
                        </div>
                        <div className="text-sm font-medium text-neutral-900 mb-2">
                          Drop files here or click to browse
                        </div>
                        <div className="text-xs text-neutral-600">
                          PDF, TXT, DOCX files (max 10MB each)
                        </div>
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
                  </div>
                </div>

                {/* Right Side - Files & Actions */}
                <div className="space-y-6">
                  {/* Uploaded Files */}
                  <div className="card">
                    <div className="card-header">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-900 rounded-lg">
                          <FileText size={16} className="text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-neutral-900">Uploaded Files ({uploadedFiles.length})</h3>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="min-h-[300px] bg-neutral-50/50 rounded-xl border border-neutral-200/50">
                        {uploadedFiles.length === 0 ? (
                          <div className="flex items-center justify-center h-[300px] text-neutral-400">
                            <div className="text-center">
                              <FileText size={36} className="mx-auto mb-3 opacity-40" />
                              <p className="text-sm font-medium">No files uploaded yet</p>
                              <p className="text-xs text-neutral-500 mt-1">Upload documents to train your agent</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                            {uploadedFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors duration-200">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="p-2 bg-neutral-50 rounded-lg">
                                    <FileText size={16} className="text-neutral-600 flex-shrink-0" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-neutral-900 truncate">{file.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-neutral-600">{formatFileSize(file.size)}</span>
                                      <span className={`badge ${
                                        file.status === 'ready' ? 'badge-default' :
                                        file.status === 'processing' ? 'badge-processing' :
                                        file.status === 'completed' ? 'badge-success' : 'badge-error'
                                      }`}>
                                        {file.status === 'ready' ? 'Ready' :
                                         file.status === 'processing' ? 'Processing...' :
                                         file.status === 'completed' ? 'Done' :
                                         'Error'}
                                      </span>
                                    </div>
                                    {file.status === 'processing' && (
                                      <div className="mt-2">
                                        <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                          <div 
                                            className="bg-orange-900 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${file.progress}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="text-neutral-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Create Button */}
                  <div className="card">
                    <div className="card-content">
                      {isProcessing ? (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 text-white rounded-xl">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-900"></div>
                            <span className="text-white text-sm font-medium">Creating and training agent...</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleCreateAndTrain}
                          disabled={!newAgent.name || uploadedFiles.length === 0}
                          className="btn-primary w-full inline-flex items-center justify-center gap-2"
                        >
                          <Sparkle size={16} className={!newAgent.name || uploadedFiles.length === 0 ? 'text-neutral-400' : 'text-orange-900'} />
                          Create & Train Agent
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}