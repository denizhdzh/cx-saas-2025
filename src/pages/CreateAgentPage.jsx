import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import Sidebar from '../components/Sidebar';
import { storage, functions } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function CreateAgentPage() {
  const { user } = useAuth();
  const { createAgent } = useAgent();
  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    description: ''
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (files) => {
    const newFiles = Array.from(files).filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const isValidType = validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
      
      // Check if file with same name and size already exists (but allow re-upload if removed)
      const isDuplicate = uploadedFiles.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      
      return isValidType && !isDuplicate;
    });

    if (newFiles.length === 0) return;

    const fileObjects = newFiles.map((file, index) => ({
      id: `${Date.now()}-${Math.random()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'processing',
      progress: 0,
      textContent: null
    }));

    setUploadedFiles(prev => [...prev, ...fileObjects]);

    // Clear the input so same file can be selected again
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';

    // Process files directly - no storage upload
    fileObjects.forEach(async (fileObj) => {
      try {
        console.log('🔍 Processing file:', fileObj.name);
        
        // Update progress to processing
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, progress: 20, status: 'extracting' }
            : f
        ));

        // Read file content directly
        const fileContent = await readFileContent(fileObj.file);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, progress: 100, status: 'ready', textContent: fileContent }
            : f
        ));
        
        console.log(`✅ File processed: ${fileObj.name} (${fileContent.length} characters)`);
        
      } catch (error) {
        console.error('Processing failed:', error);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
      }
    });
  };

  // Read file content directly in browser
  const readFileContent = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          
          if (file.type === 'text/plain') {
            const text = new TextDecoder().decode(arrayBuffer);
            resolve(text);
          } else if (file.type === 'application/pdf') {
            // For PDF, we'll need to use pdf-lib or similar
            // For now, just indicate it needs backend processing
            resolve(`[PDF Content from ${file.name} - ${file.size} bytes]`);
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // For DOCX, needs backend processing
            resolve(`[DOCX Content from ${file.name} - ${file.size} bytes]`);
          } else {
            reject(new Error('Unsupported file type'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('word')) return '📘';
    return '📄';
  };


  const handleTrainAgent = async () => {
    console.log('🚀 Train & Save button clicked!');
    
    const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) {
      alert('Please wait for file processing to complete.');
      return;
    }

    if (!formData.name || !formData.projectName) {
      alert('Please enter agent name and project name.');
      return;
    }

    console.log('✅ Starting agent creation and training...');
    setIsTraining(true);
    
    try {
      // First, create/save the agent
      const agentData = {
        ...formData,
        logoUrl: logoPreview,
        documentCount: readyFiles.length,
        trainingStatus: 'training',
        userId: user.uid,
        createdAt: new Date().toISOString()
      };

      console.log('📝 Creating agent with data:', agentData);
      
      // Create new agent in Firestore
      const agentResult = await createAgent(agentData);
      const agentId = agentResult.id || agentResult;
      console.log('✅ Agent created successfully with ID:', agentId);

      // Update file statuses to training
      setUploadedFiles(prev => prev.map(file => 
        file.status === 'ready' 
          ? { ...file, status: 'training' }
          : file
      ));

      // Prepare documents for training - send text content directly
      const documents = readyFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        textContent: file.textContent,
        processedAt: new Date().toISOString()
      }));

      console.log('🔄 Starting training with documents:', documents);

      // Call Firebase function to process and train
      const trainAgent = httpsCallable(functions, 'trainAgent');
      const trainingResult = await trainAgent({
        agentId: agentId,
        documents: documents,
        agentConfig: {
          name: formData.name,
          projectName: formData.projectName,
          userId: user.uid
        }
      });

      console.log('🎉 Training completed successfully:', trainingResult.data);

      // Update file statuses to processed
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'processed'
      })));

      setIsTraining(false);
      
      // Show success message
      alert('Agent created and trained successfully! 🎉\nYour agent is now ready to use.');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('❌ Error training agent:', error);
      
      // Update file statuses back to ready on error
      setUploadedFiles(prev => prev.map(file => 
        file.status === 'training' 
          ? { ...file, status: 'ready' }
          : file
      ));
      
      alert('Error creating/training agent: ' + (error.message || 'Unknown error'));
      setIsTraining(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Agent - Orchis</title>
        <meta name="description" content="Train your AI agent with documents" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 flex h-screen">
          {/* Left Side - Agent Configuration */}
          <div className="w-96 border-r border-neutral-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <div className="text-xs text-neutral-400 mb-8">Agent Setup</div>
              <h1 className="text-2xl font-thin text-neutral-900">
                Create New Agent
              </h1>
              <div className="w-12 h-px bg-neutral-900 mt-4"></div>
            </div>

            {/* Form */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Customer Support Bot"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="My Company"
                />
              </div>


              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Project Logo
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview && (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    Upload Logo
                  </label>
                </div>
              </div>


              {/* Document Upload Area */}
              <div className="pt-6 border-t border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-4">Training Documents</h3>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CloudArrowUpIcon className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600 mb-3">
                    Drag files here or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.docx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Choose Files
                  </label>
                  <p className="text-xs text-neutral-500 mt-2">
                    PDF, TXT, DOCX • Max 10MB each
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Uploaded Files & Training */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Documents & Training</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Upload documents to train your agent
              </p>
            </div>

            {/* Files List */}
            <div className="flex-1 p-6 overflow-y-auto">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No documents uploaded yet</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Upload documents on the left to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="card">
                      <div className="card-content py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-neutral-900">{file.name}</p>
                                <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
                              </div>
                              
                              {/* Progress bar for uploading files */}
                              {file.status === 'uploading' && (
                                <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                                  <div 
                                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-200" 
                                    style={{ width: `${file.progress}%` }}
                                  ></div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {file.status === 'processing' && (
                                    <span className="text-xs text-orange-600">Processing...</span>
                                  )}
                                  {file.status === 'extracting' && (
                                    <span className="text-xs text-blue-600">{file.progress}% extracting</span>
                                  )}
                                  {file.status === 'ready' && (
                                    <span className="badge badge-default">Ready</span>
                                  )}
                                  {file.status === 'training' && (
                                    <span className="badge badge-processing">Training</span>
                                  )}
                                  {file.status === 'processed' && (
                                    <span className="badge badge-success">Trained</span>
                                  )}
                                  {file.status === 'error' && (
                                    <span className="badge badge-error" title={file.error}>Error</span>
                                  )}
                                </div>
                                
                                {file.status !== 'uploading' && (
                                  <button
                                    onClick={() => removeFile(file.id)}
                                    className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                                  >
                                    <TrashIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Train & Save Button */}
            {uploadedFiles.filter(f => f.status === 'ready').length > 0 && formData.name && formData.projectName && (
              <div className="p-6 border-t border-neutral-200">
                <button
                  onClick={handleTrainAgent}
                  disabled={isTraining}
                  className="btn-primary w-full"
                >
                  {isTraining ? 'Training & Saving...' : 'Train & Save Agent'}
                </button>
                <p className="text-xs text-neutral-500 text-center mt-2">
                  This will create your agent and train it with uploaded documents
                </p>
              </div>
            )}
            
            {/* Requirements message */}
            {(!formData.name || !formData.projectName || uploadedFiles.length === 0) && (
              <div className="p-6 border-t border-neutral-200">
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-600 mb-2">Ready to train?</p>
                  <div className="space-y-1 text-xs text-neutral-500">
                    {!formData.name && <p>• Enter agent name</p>}
                    {!formData.projectName && <p>• Enter project name</p>}
                    {uploadedFiles.length === 0 && <p>• Upload training documents</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}