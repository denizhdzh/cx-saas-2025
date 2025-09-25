import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAgent } from '../contexts/AgentContext';
import Sidebar from '../components/Sidebar';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CpuChipIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function TrainPage() {
  const { selectedAgent, updateAgent } = useAgent();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const handleFileUpload = (files) => {
    const newFiles = Array.from(files).filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    const fileObjects = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...fileObjects]);
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
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document to train the agent.');
      return;
    }

    setIsTraining(true);
    try {
      // TODO: Implement file processing and chunking
      console.log('Training agent with files:', uploadedFiles);
      
      // Simulate training process
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(file => ({
          ...file,
          status: 'processed'
        })));
        setIsTraining(false);
        
        // Update agent training status
        if (selectedAgent) {
          updateAgent(selectedAgent.id, {
            trainingStatus: 'trained',
            documentCount: (selectedAgent.documentCount || 0) + uploadedFiles.length
          });
        }
      }, 3000);
    } catch (error) {
      console.error('Error training agent:', error);
      setIsTraining(false);
    }
  };

  if (!selectedAgent) {
    return (
      <>
        <Helmet>
          <title>Train Agent - Orchis</title>
          <meta name="description" content="Train your AI agent with documents" />
        </Helmet>
        
        <div className="min-h-screen bg-white">
          <Sidebar />
          
          <div className="ml-64 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <CpuChipIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Agent Selected</h2>
                <p className="text-gray-600">Please select an agent from the dashboard to start training.</p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white hover:opacity-90 cursor-pointer"
                  style={{
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    borderColor: 'rgb(20, 20, 20)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                  }}
                >
                  Go to Dashboard
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Train {selectedAgent.name} - Orchis</title>
        <meta name="description" content="Train your AI agent with documents" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6">
              <div className="text-xs text-gray-400 mb-2">Agent Training</div>
              <h1 className="text-lg font-medium text-gray-900">Train {selectedAgent.name}</h1>
              <p className="text-gray-600 text-sm mt-2">
                Upload documents to expand your agent's knowledge base.
              </p>
            </div>

            {/* Agent Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                {selectedAgent.logoUrl && (
                  <img 
                    src={selectedAgent.logoUrl} 
                    alt={selectedAgent.projectName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedAgent.name}</h2>
                  <p className="text-gray-600">{selectedAgent.projectName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedAgent.trainingStatus === 'trained' ? 'bg-green-100 text-green-800' :
                      selectedAgent.trainingStatus === 'training' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAgent.trainingStatus?.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedAgent.documentCount || 0} documents trained
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Upload Training Documents</h2>
              
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload training documents
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop files here, or click to browse
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
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white hover:opacity-90"
                  style={{
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    borderColor: 'rgb(20, 20, 20)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                  }}
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  Choose Files
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF, TXT, DOCX • Max 10MB per file
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">New Documents</h3>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.status === 'processed' && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        )}
                        {file.status === 'pending' && (
                          <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Train Button */}
              {uploadedFiles.length > 0 && (
                <button
                  onClick={handleTrainAgent}
                  disabled={isTraining}
                  className={`w-full py-3 rounded-md font-medium transition-colors ${
                    isTraining
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isTraining ? 'Training Agent...' : 'Train Agent with New Documents'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}