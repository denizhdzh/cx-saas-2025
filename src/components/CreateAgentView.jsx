import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { useNotification } from '../contexts/NotificationContext';
import { storage, functions } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  PhotoIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function CreateAgentView({ onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createAgent } = useAgent();
  const { showNotification } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [isManualMode, setIsManualMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    description: '',
    websiteUrl: ''
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState(null);

  const handleFetchMetadata = async () => {
    if (!formData.websiteUrl) {
      showNotification('Please enter a website URL', 'error');
      return;
    }

    setIsFetchingMetadata(true);
    try {
      // Auto-add https:// if missing
      let urlString = formData.websiteUrl.trim();
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);

      // Call Firebase Function to fetch metadata
      const fetchMetadata = httpsCallable(functions, 'fetchWebsiteMetadata');
      const result = await fetchMetadata({ url: urlString });

      const { siteName, description } = result.data;

      // Use Google's favicon service
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
      setLogoPreview(faviconUrl);

      setFormData(prev => ({
        ...prev,
        websiteUrl: urlString,
        name: siteName,
        projectName: siteName,
        description: description
      }));

      showNotification('Information loaded successfully!', 'success');
    } catch (error) {
      console.error('Error fetching metadata:', error);
      showNotification('Could not load information. Using URL as fallback.', 'error');

      // Fallback to basic info
      try {
        let urlString = formData.websiteUrl.trim();
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
          urlString = 'https://' + urlString;
        }
        const url = new URL(urlString);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
        const siteName = url.hostname.replace('www.', '').split('.')[0];

        setLogoPreview(faviconUrl);
        setFormData(prev => ({
          ...prev,
          websiteUrl: urlString,
          name: siteName.charAt(0).toUpperCase() + siteName.slice(1),
          projectName: siteName.charAt(0).toUpperCase() + siteName.slice(1)
        }));
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
      }
    } finally {
      setIsFetchingMetadata(false);
    }
  };

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
      const isValidType = validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
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

    const fileInput = document.getElementById('file-upload-create');
    if (fileInput) fileInput.value = '';

    fileObjects.forEach(async (fileObj) => {
      try {
        // Smooth progress animation: 0 -> 10 -> 30 -> 60 -> 90 -> 100
        const animateProgress = async (targetProgress, duration) => {
          const steps = 20;
          const increment = targetProgress / steps;
          const delay = duration / steps;

          for (let i = 0; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            setUploadedFiles(prev => prev.map(f =>
              f.id === fileObj.id
                ? { ...f, progress: Math.min(targetProgress, Math.round(i * increment)) }
                : f
            ));
          }
        };

        // Start uploading (0-30%)
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));
        await animateProgress(30, 800);

        // Processing (30-60%)
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'processing' }
            : f
        ));
        await animateProgress(60, 600);

        // Extracting (60-90%)
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'extracting' }
            : f
        ));
        await animateProgress(90, 400);

        // Actual backend processing
        const fileContent = await processFileWithBackend(fileObj.file);

        // Complete (90-100%)
        await animateProgress(100, 300);

        setUploadedFiles(prev => prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'ready', textContent: fileContent }
            : f
        ));

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

  const processFileWithBackend = async (file) => {
    try {
      const storageRef = ref(storage, `temp/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);

      const processDocument = httpsCallable(functions, 'processDocument');
      const result = await processDocument({
        fileName: file.name,
        fileUrl: downloadURL,
        agentId: 'temp'
      });

      return result.data.textContent || 'No text extracted';
    } catch (error) {
      console.error('Backend processing error:', error);
      throw error;
    }
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
    const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) {
      showNotification('Please wait for file processing to complete', 'error');
      return;
    }

    if (!formData.name || !formData.projectName) {
      showNotification('Please enter agent name and project name', 'error');
      return;
    }

    setIsTraining(true);

    try {
      const agentData = {
        ...formData,
        logoUrl: logoPreview,
        documentCount: readyFiles.length,
        trainingStatus: 'training',
        userId: user.uid,
        createdAt: new Date().toISOString()
      };

      const agentResult = await createAgent(agentData);
      const agentId = agentResult.id || agentResult;

      setUploadedFiles(prev => prev.map(file =>
        file.status === 'ready'
          ? { ...file, status: 'training' }
          : file
      ));

      const documents = readyFiles.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        textContent: file.textContent,
        processedAt: new Date().toISOString()
      }));

      const trainAgent = httpsCallable(functions, 'trainAgent');
      await trainAgent({
        agentId: agentId,
        documents: documents,
        agentConfig: {
          name: formData.name,
          projectName: formData.projectName,
          userId: user.uid
        }
      });

      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'processed'
      })));

      setIsTraining(false);
      setTrainingComplete(true);
      setCreatedAgentId(agentId);
      showNotification('Agent created and trained successfully! 🎉', 'success');

    } catch (error) {
      console.error('❌ Error training agent:', error);

      setUploadedFiles(prev => prev.map(file =>
        file.status === 'training'
          ? { ...file, status: 'ready' }
          : file
      ));

      showNotification('Error: ' + (error.message || 'Could not create agent'), 'error');
      setIsTraining(false);
    }
  };

  const canGoToNextStep = () => {
    if (currentStep === 1) {
      return formData.name && formData.projectName && logoPreview;
    }
    if (currentStep === 2) {
      return uploadedFiles.filter(f => f.status === 'ready').length > 0;
    }
    return true;
  };

  const renderStepIndicator = () => {
    let displayStep = currentStep;
    let stepTitle = '';

    if (currentStep === 1) {
      stepTitle = 'Project Details';
    } else if (currentStep === 2) {
      stepTitle = 'Upload Documents';
    } else if (currentStep === 3) {
      if (trainingComplete) {
        displayStep = 4;
        stepTitle = 'Embed Code';
      } else if (isTraining) {
        stepTitle = 'Training Agent...';
      } else {
        stepTitle = 'Train Agent';
      }
    }

    return (
      <div className="mb-6 text-center">
        <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">
          Step {displayStep} of 4
        </div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          {stepTitle}
        </h2>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {!isManualMode ? (
        <>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Website URL
            </label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              className="form-input text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl"
              placeholder="https://example.com"
            />
            <button
              onClick={handleFetchMetadata}
              disabled={isFetchingMetadata}
              className="w-full btn-primary text-sm py-2 rounded-2xl"
            >
              {isFetchingMetadata ? 'Loading...' : 'Continue'}
            </button>
          </div>

          <button
            onClick={() => setIsManualMode(true)}
            className="w-full text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 py-2 flex items-center justify-center gap-1.5 transition-colors"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            Enter manually instead
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setIsManualMode(false)}
            className="w-full text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 py-1.5 flex items-center justify-center gap-1.5 transition-colors mb-2"
          >
            <GlobeAltIcon className="w-3.5 h-3.5" />
            Fetch from URL instead
          </button>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                  Agent Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl"
                  placeholder="Support Bot"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="form-input text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl"
                  placeholder="My Company"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                Logo
              </label>
              <div className="flex items-center gap-3">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload-step1"
                />
                <label
                  htmlFor="logo-upload-step1"
                  className="btn-secondary text-xs py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PhotoIcon className="w-3.5 h-3.5" />
                  Upload
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {logoPreview && (
        <div className="pt-3 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl">
            <img
              src={logoPreview}
              alt="Preview"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-900 dark:text-stone-50 truncate">
                {formData.name || 'Agent Name'}
              </div>
              <div className="text-xs text-stone-500 truncate">
                {formData.projectName || 'Project Name'}
              </div>
            </div>
            <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
          isDragging ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'border-stone-300 dark:border-stone-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudArrowUpIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
          Drop files or click to browse
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload-create"
        />
        <label
          htmlFor="file-upload-create"
          className="btn-secondary text-xs py-1.5 px-4 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
        >
          <DocumentTextIcon className="w-3.5 h-3.5" />
          Choose Files
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="border border-stone-200 dark:border-stone-700 rounded-2xl p-3 bg-white dark:bg-stone-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-50 truncate">{file.name}</p>

                    {(file.status === 'uploading' || file.status === 'processing' || file.status === 'extracting') && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-orange-600 font-medium">
                            {file.status === 'uploading' && 'Uploading...'}
                            {file.status === 'processing' && 'Processing...'}
                            {file.status === 'extracting' && 'Extracting text...'}
                          </span>
                          <span className="text-xs text-orange-600 font-bold">{file.progress}%</span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-400 h-1.5 rounded-full transition-all duration-300 relative"
                            style={{ width: `${file.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      {file.status === 'ready' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircleIcon className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="text-xs text-red-600 font-medium">Error</span>
                      )}
                      <span className="text-xs text-stone-400">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>

                {file.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors ml-2"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (trainingComplete && createdAgentId) {
      // Show embed code after training
      const embedCode = `<script src="${window.location.origin}/widget.js" data-agent-id="${createdAgentId}"></script>`;

      return (
        <div className="space-y-4">
          <div className="bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-stone-900 dark:text-stone-50" />
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Training Complete!</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
              Your agent is ready to use. Copy the embed code below to add it to your website.
            </p>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Embed Code</span>
              </div>
              <pre className="text-xs text-stone-600 dark:text-stone-400 overflow-x-auto whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (isTraining) {
      // Show minimal training animation
      const trainingDocsCount = uploadedFiles.filter(f => f.status === 'training' || f.status === 'processed').length;
      return (
        <div className="space-y-4">
          <div className="bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <DotLottieReact
                src="https://lottie.host/56d69763-6dce-4f89-a793-a99e449bfb8e/3bKiUL2DRP.lottie"
                loop
                autoplay
                style={{ width: '120px', height: '120px' }}
              />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">Training Your Agent...</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Processing {trainingDocsCount} document{trainingDocsCount !== 1 ? 's' : ''}. This may take a minute.
            </p>
          </div>
        </div>
      );
    }

    // Default review state
    return (
      <div className="space-y-4">
        <div className="bg-stone-50 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Agent logo"
                className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">{formData.name}</div>
              <div className="text-xs text-stone-600 dark:text-stone-400">{formData.projectName}</div>
              {formData.websiteUrl && (
                <div className="text-xs text-blue-500 mt-1 truncate">{formData.websiteUrl}</div>
              )}
            </div>
          </div>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Training Documents</span>
              <span className="text-xs font-bold text-green-600">{uploadedFiles.filter(f => f.status === 'ready').length}</span>
            </div>
            <div className="space-y-1.5">
              {uploadedFiles.filter(f => f.status === 'ready').map((file) => (
                <div key={file.id} className="flex items-center gap-2 text-xs">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700 dark:text-stone-300 truncate flex-1">{file.name}</span>
                  <span className="text-stone-500 text-xs">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-3">
          <p className="text-xs text-stone-700 dark:text-stone-300">
            Ready to train your agent with {uploadedFiles.filter(f => f.status === 'ready').length} document{uploadedFiles.filter(f => f.status === 'ready').length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-2 py-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-50 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 mb-4 text-xs"
      >
        <ArrowLeftIcon className="w-3 h-3" />
        Back
      </button>



      {renderStepIndicator()}

      <div className="bg-white dark:bg-stone-800/50 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 mb-4">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <div className="flex items-center justify-between">
        {!trainingComplete && (
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="btn-secondary text-xs py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-3 h-3" />
            Previous
          </button>
        )}

        <div className={`flex items-center gap-2 ${trainingComplete ? 'w-full' : ''}`}>
          {currentStep < 3 && (
            <button
              onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
              disabled={!canGoToNextStep()}
              className="btn-primary text-xs py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRightIcon className="w-3 h-3" />
            </button>
          )}

          {currentStep === 3 && !trainingComplete && (
            <button
              onClick={handleTrainAgent}
              disabled={isTraining || uploadedFiles.filter(f => f.status === 'ready').length === 0}
              className="btn-primary text-xs py-1.5 px-4 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isTraining ? (
                <>
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                  Training...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Train & Create
                </>
              )}
            </button>
          )}

          {trainingComplete && createdAgentId && (
            <>
              <button
                onClick={() => {
                  const embedCode = `<script src="${window.location.origin}/widget.js" data-agent-id="${createdAgentId}"></script>`;
                  navigator.clipboard.writeText(embedCode);
                  showNotification('Embed code copied to clipboard!', 'success');
                }}
                className="flex-1 btn-secondary text-xs py-2 rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                Copy Embed Code
              </button>
              <button
                onClick={() => navigate(`/dashboard/${createdAgentId}`)}
                className="flex-1 btn-primary text-xs py-2 rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
