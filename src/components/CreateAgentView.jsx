import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { useNotification } from '../contexts/NotificationContext';
import { storage, functions, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

import UpgradeModal from './UpgradeModal';
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
  PencilIcon,
  GiftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function CreateAgentView({ onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createAgent, agents } = useAgent();
  const { showNotification } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    projectName: '',
    websiteUrl: '',
    trainingText: '',
    privacyUrl: '',
    termsUrl: ''
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState(null);

  // Fetch progress states
  const [fetchProgress, setFetchProgress] = useState({
    current: 0,
    total: 4,
    currentStep: '',
    completed: []
  });
  const [metadataFetched, setMetadataFetched] = useState(false);

  // Modal states
  const [showTextModal, setShowTextModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);

  // Subscription and limit tracking
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [currentAgentCount, setCurrentAgentCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Dynamic Contents / Popups (Step 3) - EmbedView style
  const [popups, setPopups] = useState([]);
  const [editingPopup, setEditingPopup] = useState(null);
  const [showPopupForm, setShowPopupForm] = useState(false);
  const [popupFormStep, setPopupFormStep] = useState(1); // 1 or 2
  const [popupForm, setPopupForm] = useState({
    trigger: 'first_visit',
    triggerValue: 3,
    contentType: 'discount',
    title: 'Welcome! 👋',
    message: 'Get a special discount with code',
    code: 'RETURN20',
    discountPercent: 20,
    buttonText: 'Get Discount',
    buttonLink: 'https://orchis.app',
    videoUrl: 'https://www.youtube.com/watch?v=qU9mHegkTc4'
  });

  // Fetch user subscription and agent count on mount
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;

      try {
        // Get user subscription data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSubscriptionData({
            plan: userData.subscriptionPlan || 'free',
            agentLimit: userData.agentLimit || 0,
            status: userData.subscriptionStatus || 'free'
          });
        }

        // Count existing agents
        const agentsRef = collection(db, 'users', user.uid, 'agents');
        const agentsSnapshot = await getDocs(agentsRef);
        setCurrentAgentCount(agentsSnapshot.size);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  // Listen to training status updates from Firestore
  useEffect(() => {
    if (!createdAgentId || !user) return;

    console.log('👂 Setting up Firestore listener for agent:', createdAgentId);

    let hasNotifiedSuccess = false;
    let hasNotifiedFailure = false;

    const agentRef = doc(db, 'users', user.uid, 'agents', createdAgentId);
    const unsubscribe = onSnapshot(agentRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('📊 Training status update:', data.trainingStatus);

        if (data.trainingStatus === 'trained' && !hasNotifiedSuccess) {
          console.log('✅ Training complete!');
          setIsTraining(false);
          setTrainingComplete(true);
          showNotification('Agent trained successfully! 🎉', 'success');
          hasNotifiedSuccess = true;
        } else if (data.trainingStatus === 'training') {
          console.log('🔄 Still training...');
        } else if (data.trainingStatus === 'failed' && !hasNotifiedFailure) {
          console.log('❌ Training failed');
          setIsTraining(false);
          showNotification('Training failed. Please try again.', 'error');
          hasNotifiedFailure = true;
        }
      }
    }, (error) => {
      console.error('❌ Firestore listener error:', error);
    });

    return () => {
      console.log('🔇 Cleaning up Firestore listener');
      unsubscribe();
    };
  }, [createdAgentId, user]); // showNotification'ı dependency'den çıkardık

  const handleFetchMetadata = async () => {
    if (!formData.websiteUrl) {
      showNotification('Please enter a website URL', 'error');
      return;
    }

    setIsFetchingMetadata(true);
    setFetchProgress({ current: 0, total: 4, currentStep: 'Starting...', completed: [] });

    const fetchSteps = [
      { key: 'logo', label: 'Grabbing your brand logo...' },
      { key: 'title', label: 'Learning your business name...' },
      { key: 'description', label: 'Understanding what you do...' },
      { key: 'metadata', label: 'Almost ready for your chatbot!' }
    ];

    try {
      // Auto-add https:// if missing
      let urlString = formData.websiteUrl.trim();
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);

      // Animate progress steps
      for (let i = 0; i < fetchSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFetchProgress({
          current: i + 1,
          total: fetchSteps.length,
          currentStep: fetchSteps[i].label,
          completed: fetchSteps.slice(0, i + 1).map(s => s.key)
        });
      }

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

      setMetadataFetched(true);
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
        setMetadataFetched(true);
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

    // Check total training content (text + files)
    const totalTrainingContent = formData.trainingText.trim().length +
      readyFiles.reduce((acc, f) => acc + (f.textContent?.length || 0), 0);

    if (totalTrainingContent < 100) {
      showNotification('Please provide at least 100 characters of training content', 'error');
      return;
    }

    if (!formData.projectName || !formData.websiteUrl) {
      showNotification('Please enter agent name and website URL', 'error');
      return;
    }

    // Check agent limit before creating
    if (subscriptionData) {
      const { agentLimit } = subscriptionData;

      // If agentLimit is not -1 (unlimited) and current count >= limit, show upgrade modal
      if (agentLimit !== -1 && currentAgentCount >= agentLimit) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsTraining(true);

    // Give time for UI to update before heavy operations
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Extract domain from website URL for allowed domains
      let allowedDomains = [];
      let normalizedUrl = formData.websiteUrl;

      if (formData.websiteUrl) {
        try {
          // Auto-add https:// if missing
          if (!formData.websiteUrl.startsWith('http://') && !formData.websiteUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + formData.websiteUrl.trim();
          }

          const url = new URL(normalizedUrl);
          // Remove 'www.' prefix if present
          const domain = url.hostname.replace(/^www\./, '');
          allowedDomains = [domain, 'orchis.app'];
          console.log('✅ Extracted domain for allowedDomains:', domain);
        } catch (e) {
          console.warn('Could not extract domain from URL:', e);
          // If URL parsing fails, just leave allowedDomains empty
        }
      }


      const agentData = {
        ...formData,
        websiteUrl: normalizedUrl, // Use normalized URL with https://
        logoUrl: logoPreview,
        documentCount: readyFiles.length,
        trainingStatus: 'training',
        allowedDomains: allowedDomains,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        // Add dynamic contents/popups
        popups: popups
      };

      console.log('📦 Agent Data being sent:', {
        popups: agentData.popups,
        popupsCount: popups.length
      });

      const agentResult = await createAgent(agentData);
      const agentId = agentResult.id || agentResult;

      setUploadedFiles(prev => prev.map(file =>
        file.status === 'ready'
          ? { ...file, status: 'training' }
          : file
      ));

      const documents = [];

      // Add pasted training text as a document
      if (formData.trainingText.trim()) {
        documents.push({
          id: `text-${Date.now()}`,
          name: 'Pasted Training Content',
          type: 'text/plain',
          textContent: formData.trainingText.trim(),
          processedAt: new Date().toISOString()
        });
      }

      // Add uploaded files
      readyFiles.forEach(file => {
        documents.push({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          textContent: file.textContent,
          processedAt: new Date().toISOString()
        });
      });

      // Add privacy URL as a training document if provided
      if (formData.privacyUrl?.trim()) {
        documents.push({
          id: `privacy-${Date.now()}`,
          name: 'Privacy Policy',
          type: 'url',
          url: formData.privacyUrl.trim(),
          processedAt: new Date().toISOString()
        });
      }

      // Add terms URL as a training document if provided
      if (formData.termsUrl?.trim()) {
        documents.push({
          id: `terms-${Date.now()}`,
          name: 'Terms of Service',
          type: 'url',
          url: formData.termsUrl.trim(),
          processedAt: new Date().toISOString()
        });
      }

      const trainAgent = httpsCallable(functions, 'trainAgent');

      // Start training - backend processes fully before returning
      await trainAgent({
        agentId: agentId,
        documents: documents,
        agentConfig: {
          projectName: formData.projectName,
          userId: user.uid
        }
      });

      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'processed'
      })));

      console.log('✅ Training completed! Agent ID:', agentId);
      console.log('🚫 NOT navigating - staying on create page to show embed code');

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
      return formData.projectName && formData.websiteUrl && logoPreview;
    }
    if (currentStep === 2) {
      const totalTrainingContent = formData.trainingText.trim().length +
        uploadedFiles.filter(f => f.status === 'ready').reduce((acc, f) => acc + (f.textContent?.length || 0), 0);
      return totalTrainingContent >= 100;
    }
    if (currentStep === 3) {
      // Step 3 is optional, always allow next
      return true;
    }
    if (currentStep === 4) {
      // Check limit before training
      if (subscriptionData) {
        const { agentLimit } = subscriptionData;
        if (agentLimit !== -1 && currentAgentCount >= agentLimit) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const renderStepIndicator = () => {
    let stepTitle = '';

    if (currentStep === 1) {
      stepTitle = 'Website Info';
    } else if (currentStep === 2) {
      stepTitle = 'Training Content';
    } else if (currentStep === 3) {
      stepTitle = 'Dynamic Contents';
    } else if (currentStep === 4) {
      if (trainingComplete) {
        stepTitle = 'Embed Code';
      } else if (isTraining) {
        stepTitle = 'Training Agent...';
      } else {
        stepTitle = 'Train Agent';
      }
    }

    // For steps 1-3, show minimal dot indicators
    if (currentStep <= 3) {
      return (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? 'w-8 bg-neutral-900 dark:bg-neutral-50'
                    : step < currentStep
                    ? 'w-1.5 bg-neutral-400 dark:bg-neutral-500'
                    : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50 text-center">
            {stepTitle}
          </h2>
        </div>
      );
    }

    // For step 4, don't show step counter - it's the final action step
    return (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50 text-center">
          {stepTitle}
        </h2>
      </div>
    );
  };

  const renderStep1 = () => {
    // Show fetching animation
    if (isFetchingMetadata) {
      return (
        <div className="space-y-4 text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-50 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-50 rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-50 rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Setting up your chatbot...
          </h3>
          <div className="max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">{fetchProgress.currentStep}</span>
              <span className="text-xs text-neutral-900 dark:text-neutral-50 font-bold">
                {Math.round((fetchProgress.current / fetchProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-neutral-900 dark:bg-neutral-50 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="mt-4 space-y-2 text-left">
              {['logo', 'title', 'description', 'metadata'].map((step, idx) => (
                <div key={step} className="flex items-center gap-2 text-xs">
                  {fetchProgress.completed.includes(step) ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600"></div>
                  )}
                  <span className={fetchProgress.completed.includes(step) ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'}>
                    {['Your logo', 'Business name', 'What you do', 'Chatbot ready!'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Show success state with editable fields
    if (metadataFetched && logoPreview) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-sm text-green-600 font-medium mb-3">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Got it! Review your details:</span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <img
                src={logoPreview}
                alt="Logo"
                className="w-20 h-20 rounded-xl object-cover dark:border-neutral-700"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload-step1-edit"
              />
              <label
                htmlFor="logo-upload-step1-edit"
                className="absolute -bottom-2 -right-2 p-1.5 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 rounded-lg cursor-pointer hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors shadow-lg"
                title="Change logo"
              >
                <PencilIcon className="w-3 h-3" />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className="form-input text-sm text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                className="form-input text-sm text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                placeholder="https://example.com"
              />
            </div>

          </div>
        </div>
      );
    }

    // Initial input state
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Enter your website URL and we'll fetch everything automatically
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            Website URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && formData.websiteUrl) {
                  handleFetchMetadata();
                }
              }}
              className="form-input text-sm text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl flex-1"
              placeholder="https://example.com"
            />
            <button
              onClick={handleFetchMetadata}
              disabled={!formData.websiteUrl || isFetchingMetadata}
              className="btn-primary text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <SparklesIcon className="w-4 h-4" />
              Auto-fill
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            We'll automatically grab your logo, site title, and description
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <p className="text-xs text-neutral-700 dark:text-neutral-300">
            <strong>Tip:</strong> Paste your website URL and click Auto-fill. We'll do the rest!
          </p>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
    const totalTrainingContent = formData.trainingText.trim().length +
      readyFiles.reduce((acc, f) => acc + (f.textContent?.length || 0), 0);
    const hasTrainingContent = totalTrainingContent >= 100;

    const hasText = formData.trainingText.trim().length > 0;
    const hasDocuments = uploadedFiles.filter(f => f.status === 'ready').length > 0;
    const hasLinks = formData.privacyUrl || formData.termsUrl;

    return (
      <>
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Choose how to train your agent
            </p>
          </div>

          {/* 3 Cards */}
          <div className="space-y-3">
            {/* Text Card */}
            <button
              onClick={() => setShowTextModal(true)}
              className="w-full text-left border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 hover:border-neutral-900 dark:hover:border-neutral-400 transition-all bg-white dark:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  hasText
                    ? 'bg-green-500 border-green-500'
                    : 'border-neutral-900 dark:border-neutral-400 bg-neutral-50 dark:bg-neutral-800'
                }`}>
                  {hasText && <CheckCircleIcon className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Text Content
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {hasText
                      ? `✓ ${formData.trainingText.length} characters added`
                      : 'Paste FAQs, product info, or business details'}
                  </p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-neutral-400" />
              </div>
            </button>

            {/* Documents Card */}
            <button
              onClick={() => setShowDocumentModal(true)}
              className="w-full text-left border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 hover:border-neutral-900 dark:hover:border-neutral-400 transition-all bg-white dark:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  hasDocuments
                    ? 'bg-green-500 border-green-500'
                    : 'border-neutral-900 dark:border-neutral-400 bg-neutral-50 dark:bg-neutral-800'
                }`}>
                  {hasDocuments && <CheckCircleIcon className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Documents
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {hasDocuments
                      ? `✓ ${uploadedFiles.filter(f => f.status === 'ready').length} file(s) uploaded`
                      : 'Upload PDFs, Word docs, or text files'}
                  </p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-neutral-400" />
              </div>
            </button>

            {/* Links Card */}
            <button
              onClick={() => setShowLinksModal(true)}
              className="w-full text-left border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 hover:border-neutral-900 dark:hover:border-neutral-400 transition-all bg-white dark:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  hasLinks
                    ? 'bg-green-500 border-green-500'
                    : 'border-neutral-300 dark:border-neutral-600'
                }`}>
                  {hasLinks && <CheckCircleIcon className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      Policy Links
                    </h3>
                    <span className="text-xs text-neutral-500">Optional</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {hasLinks
                      ? '✓ Added'
                      : 'Privacy Policy & Terms of Service URLs'}
                  </p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-neutral-400" />
              </div>
            </button>
          </div>

          {/* Summary */}
          {hasTrainingContent && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                ✓ Ready to continue! Your agent has {totalTrainingContent} characters of training content.
              </p>
            </div>
          )}

          {!hasTrainingContent && (
            <div className="mt-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl p-3">
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                ⚠️ Please add at least 300 characters of training content to continue.
              </p>
            </div>
          )}
        </div>

        {/* Text Modal */}
        {showTextModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTextModal(false)}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-5 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Text Content</h2>
                  <button onClick={() => setShowTextModal(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">✕</button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Paste Training Text</label>
                    <button
                      onClick={() => {
                        const template = `Q: What are your business hours?\nA: We're open 9am-5pm Mon-Fri\n\nQ: How can I contact support?\nA: Email support@example.com\n\nQ: What products/services do you offer?\nA: \n\nQ: What is your pricing?\nA: `;
                        setFormData({...formData, trainingText: template});
                      }}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      Use template
                    </button>
                  </div>
                  <textarea
                    name="trainingText"
                    value={formData.trainingText}
                    onChange={handleInputChange}
                    placeholder="Paste FAQ, product info, or any details...&#10;&#10;Example:&#10;Q: What are your hours?&#10;A: We're open 9am-5pm Mon-Fri"
                    className="form-textarea text-sm text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl w-full h-48 resize-none"
                    maxLength={10000}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{formData.trainingText.length} / 10,000 characters</span>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-5">
                <button onClick={() => setShowTextModal(false)} className="btn-primary w-full py-2 rounded-xl">Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDocumentModal(false)}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-5 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Upload Documents</h2>
                  <button onClick={() => setShowDocumentModal(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">✕</button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${isDragging ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'border-neutral-300 dark:border-neutral-700'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CloudArrowUpIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Drop files or click to browse</p>
                  <input type="file" multiple accept=".pdf,.txt,.docx" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="file-upload-create" />
                  <label htmlFor="file-upload-create" className="btn-secondary text-xs py-1.5 px-4 rounded-xl inline-flex items-center gap-1.5 cursor-pointer">
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    Choose Files
                  </label>
                  <p className="text-xs text-neutral-500 mt-2">PDF, TXT, DOCX (max 10MB each)</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-neutral-900 dark:text-neutral-50 truncate">{file.name}</p>
                              {(file.status === 'uploading' || file.status === 'processing' || file.status === 'extracting') && (
                                <div className="mt-1.5 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-orange-600 font-medium">
                                      {file.status === 'uploading' && 'Uploading...'}
                                      {file.status === 'processing' && 'Processing...'}
                                      {file.status === 'extracting' && 'Extracting...'}
                                    </span>
                                    <span className="text-xs text-orange-600 font-bold">{file.progress}%</span>
                                  </div>
                                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
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
                                <span className="text-xs text-neutral-400">{formatFileSize(file.size)}</span>
                              </div>
                            </div>
                          </div>
                          {file.status !== 'uploading' && (
                            <button onClick={() => removeFile(file.id)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors ml-2">
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-5">
                <button onClick={() => setShowDocumentModal(false)} className="btn-primary w-full py-2 rounded-xl">Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Links Modal */}
        {showLinksModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLinksModal(false)}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Policy Links (Optional)</h2>
                  <button onClick={() => setShowLinksModal(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">✕</button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Add links to help your agent answer policy questions</p>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Privacy Policy URL</label>
                  <input type="url" name="privacyUrl" value={formData.privacyUrl} onChange={handleInputChange} placeholder="https://example.com/privacy" className="form-input text-sm text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Terms of Service URL</label>
                  <input type="url" name="termsUrl" value={formData.termsUrl} onChange={handleInputChange} placeholder="https://example.com/terms" className="form-input text-sm text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl w-full" />
                </div>
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-5">
                <button onClick={() => setShowLinksModal(false)} className="btn-primary w-full py-2 rounded-xl">Done</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Helper functions for popup labels (same as EmbedView)
  const getTriggerLabel = (trigger, value) => {
    const labels = {
      first_visit: 'First Visit',
      return_visit: 'Return Visit',
      exit_intent: 'Exit Intent',
      time_delay: `After ${value}s`,
      scroll_depth: `Scroll ${value}%`
    };
    return labels[trigger] || trigger;
  };

  const getContentTypeLabel = (type) => {
    const labels = {
      discount: 'Discount',
      announcement: 'Announcement',
      video: 'Video',
      link: 'Link'
    };
    return labels[type] || type;
  };

  const handleAddPopup = () => {
    const newPopup = {
      id: Date.now().toString(),
      ...popupForm
    };
    setPopups([...popups, newPopup]);
    setEditingPopup(null);
    setShowPopupForm(false);
    setPopupFormStep(1);

    // Reset form
    setPopupForm({
      trigger: 'first_visit',
      triggerValue: 3,
      contentType: 'discount',
      title: 'Welcome! 👋',
      message: 'Get a special discount with code',
      code: 'RETURN20',
      discountPercent: 20,
      buttonText: 'Get Discount',
      buttonLink: 'https://orchis.app',
      videoUrl: 'https://www.youtube.com/watch?v=qU9mHegkTc4'
    });
  };

  const handleUpdatePopup = () => {
    setPopups(popups.map(p =>
      p.id === editingPopup.id ? { ...popupForm, id: editingPopup.id } : p
    ));
    setEditingPopup(null);
    setShowPopupForm(false);
    setPopupFormStep(1);

    // Reset form
    setPopupForm({
      trigger: 'first_visit',
      triggerValue: 3,
      contentType: 'discount',
      title: 'Welcome! 👋',
      message: 'Get a special discount with code',
      code: 'RETURN20',
      discountPercent: 20,
      buttonText: 'Get Discount',
      buttonLink: 'https://orchis.app',
      videoUrl: 'https://www.youtube.com/watch?v=qU9mHegkTc4'
    });
  };

  const handleDeletePopup = (popupId) => {
    setPopups(popups.filter(p => p.id !== popupId));
  };


  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <GiftIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
              Dynamic Contents (Optional)
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Create popups with discounts, announcements, videos, or links. Skip for now or configure later.
            </p>
          </div>
        </div>
      </div>

      {/* Existing Popups List */}
      {popups.length > 0 && !showPopupForm && (
        <div className="space-y-2">
          {popups.map((popup) => (
            <div key={popup.id} className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded">
                      {getTriggerLabel(popup.trigger, popup.triggerValue)}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded">
                      {getContentTypeLabel(popup.contentType)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{popup.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{popup.message}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => {
                      setEditingPopup(popup);
                      setPopupForm(popup);
                      setShowPopupForm(true);
                      setPopupFormStep(1);
                    }}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePopup(popup.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2-Step Inline Form */}
      {showPopupForm && (
        <div className="bg-transparent rounded-xl p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${popupFormStep === 1 ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>1</div>
              <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-700"></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${popupFormStep === 2 ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>2</div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 ml-2">
                {popupFormStep === 1 ? 'Type & Trigger' : 'Content'}
              </span>
            </div>
            <button
              onClick={() => {
                setShowPopupForm(false);
                setPopupFormStep(1);
                setEditingPopup(null);
              }}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Step 1: Type & Trigger */}
          {popupFormStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Content Type
                </label>
                <select
                  value={popupForm.contentType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let updates = { contentType: newType };

                    // Auto-update message and other fields based on type
                    if (newType === 'discount') {
                      updates.message = 'Get a special discount with code';
                      updates.code = 'RETURN20';
                      updates.title = 'Welcome! 👋';
                    } else if (newType === 'video') {
                      updates.message = 'Check out this video';
                      updates.videoUrl = 'https://www.youtube.com/watch?v=qU9mHegkTc4';
                      updates.title = 'Watch Now 🎥';
                    } else if (newType === 'link') {
                      updates.message = 'Visit our website for more info';
                      updates.buttonLink = 'https://orchis.app';
                      updates.title = 'Check This Out 🔗';
                    } else if (newType === 'announcement') {
                      updates.message = 'We have exciting news to share!';
                      updates.title = 'Announcement 📢';
                    }

                    setPopupForm({...popupForm, ...updates});
                  }}
                  className="form-select text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                >
                  <option value="discount">💰 Discount Code</option>
                  <option value="announcement">📢 Announcement</option>
                  <option value="video">🎥 Video</option>
                  <option value="link">🔗 Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  When to Show
                </label>
                <select
                  value={popupForm.trigger}
                  onChange={(e) => setPopupForm({...popupForm, trigger: e.target.value})}
                  className="form-select text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                >
                  <option value="first_visit">👋 First Visit</option>
                  <option value="return_visit">🔄 Return Visit</option>
                  <option value="exit_intent">🚪 Exit Intent</option>
                  <option value="time_delay">⏱️ Time Delay</option>
                  <option value="scroll_depth">📜 Scroll Depth</option>
                </select>
              </div>

              {(popupForm.trigger === 'time_delay' || popupForm.trigger === 'scroll_depth') && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {popupForm.trigger === 'time_delay' ? 'Delay (seconds)' : 'Scroll %'}
                  </label>
                  <input
                    type="number"
                    value={popupForm.triggerValue}
                    onChange={(e) => setPopupForm({...popupForm, triggerValue: parseInt(e.target.value)})}
                    className="form-input text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                    min="1"
                    max={popupForm.trigger === 'scroll_depth' ? '100' : '999'}
                  />
                </div>
              )}

              <button
                onClick={() => setPopupFormStep(2)}
                className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl py-2 text-sm font-medium"
              >
                Next →
              </button>
            </div>
          )}

          {/* Step 2: Content */}
          {popupFormStep === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={popupForm.title}
                  onChange={(e) => setPopupForm({...popupForm, title: e.target.value})}
                  className="form-input text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Message</label>
                <textarea
                  value={popupForm.message}
                  onChange={(e) => setPopupForm({...popupForm, message: e.target.value})}
                  className="form-textarea text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                  rows="2"
                />
              </div>

              {popupForm.contentType === 'discount' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Code</label>
                    <input
                      type="text"
                      value={popupForm.code}
                      onChange={(e) => setPopupForm({...popupForm, code: e.target.value})}
                      className="form-input text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Discount %</label>
                    <input
                      type="number"
                      value={popupForm.discountPercent}
                      onChange={(e) => setPopupForm({...popupForm, discountPercent: parseInt(e.target.value)})}
                      className="form-input text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                    />
                  </div>
                </>
              )}

              {popupForm.contentType === 'video' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Video URL</label>
                  <input
                    type="url"
                    value={popupForm.videoUrl}
                    onChange={(e) => setPopupForm({...popupForm, videoUrl: e.target.value})}
                    className="form-input text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              )}

              {(popupForm.contentType === 'link' || popupForm.contentType === 'discount') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Button Link (optional)</label>
                    <input
                      type="url"
                      value={popupForm.buttonLink}
                      onChange={(e) => setPopupForm({...popupForm, buttonLink: e.target.value})}
                      className="form-input text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white rounded-xl w-full py-2"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPopupFormStep(1)}
                  className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-xl py-2 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={editingPopup ? handleUpdatePopup : handleAddPopup}
                  className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl py-2 text-sm font-medium"
                >
                  {editingPopup ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Button */}
      {!showPopupForm && (
        <button
          onClick={() => {
            setEditingPopup(null);
            setPopupForm({
              trigger: 'first_visit',
              triggerValue: 3,
              contentType: 'discount',
              title: 'Welcome! 👋',
              message: 'Get a special discount on your first purchase',
              code: 'FIRST20',
              discountPercent: 20,
              buttonText: 'Get Discount',
              buttonLink: '',
              videoUrl: ''
            });
            setShowPopupForm(true);
            setPopupFormStep(1);
          }}
          className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span>
          Add Dynamic Content
        </button>
      )}
    </div>
  );


  const renderStep4 = () => {
    if (trainingComplete && createdAgentId) {
      // Show embed code after training
      const embedCode = `<!-- Orchis Chatbot -->
<script>
(function(){
  if(!window.OrchisChatbot){
    const script = document.createElement('script');
    script.src = 'https://orchis.app/chatbot-widget.js';
    script.onload = function() {
      if(window.OrchisChatbot) {
        window.OrchisChatbot.init({
          agentId: '${createdAgentId}'
        });
      }
    };
    document.head.appendChild(script);
  }
})();
</script>`;

      return (
        <div className="space-y-4">
          <div className="bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-neutral-900 dark:text-neutral-50" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Training Complete!</h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Your agent is ready to use. Copy the embed code below and paste it into your website's HTML.
            </p>

            {/* Installation Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  i
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Installation Instructions
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>Paste this code inside your website's <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">&lt;body&gt;</code> tag, preferably before the closing <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">&lt;/body&gt;</code> tag.</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400">💡 The chatbot will appear on all pages where this code is added.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Embed Code</span>
              </div>
              <pre className="text-xs text-neutral-600 dark:text-neutral-400 overflow-x-auto whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (isTraining) {
      // Show minimal training animation
      const totalTrainingItems = (formData.trainingText.trim() ? 1 : 0) +
        uploadedFiles.filter(f => f.status === 'training' || f.status === 'processed').length +
        (formData.privacyUrl?.trim() ? 1 : 0) +
        (formData.termsUrl?.trim() ? 1 : 0);

      return (
        <div className="space-y-4">
          <div className="bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 text-center">
            {/* 3 Dot Loader */}
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-50 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-50 rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-50 rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">Training Your Agent...</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Processing {totalTrainingItems} training item{totalTrainingItems !== 1 ? 's' : ''}. This may take a minute.
            </p>

            {/* Training Steps Flow */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-neutral-900 dark:text-neutral-50">Analyzing Training Data</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Completed</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-neutral-900 dark:text-neutral-50">Building AI Model</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">In progress...</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Finalizing Setup</div>
                  <div className="text-xs text-neutral-400 dark:text-neutral-500">Waiting...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default review state
    return (
      <div className="space-y-4">
        <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Agent logo"
                className="w-12 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{formData.name}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">{formData.projectName}</div>
              {formData.websiteUrl && (
                <div className="text-xs text-blue-500 mt-1 truncate">{formData.websiteUrl}</div>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Training Content</span>
              <span className="text-xs font-bold text-green-600">
                {(formData.trainingText.trim() ? 1 : 0) + uploadedFiles.filter(f => f.status === 'ready').length}
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Pasted Training Text */}
              {formData.trainingText.trim() && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 truncate flex-1">Pasted Training Content</span>
                  <span className="text-neutral-500 text-xs">{formData.trainingText.trim().length} chars</span>
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.filter(f => f.status === 'ready').map((file) => (
                <div key={file.id} className="flex items-center gap-2 text-xs">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 truncate flex-1">{file.name}</span>
                  <span className="text-neutral-500 text-xs">{formatFileSize(file.size)}</span>
                </div>
              ))}

              {/* Policy URLs */}
              {formData.privacyUrl?.trim() && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 truncate flex-1">Privacy Policy</span>
                  <span className="text-neutral-500 text-xs">URL</span>
                </div>
              )}
              {formData.termsUrl?.trim() && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 truncate flex-1">Terms of Service</span>
                  <span className="text-neutral-500 text-xs">URL</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-3">
          <p className="text-xs text-neutral-700 dark:text-neutral-300">
            Ready to train your agent with {(formData.trainingText.trim() ? 1 : 0) + uploadedFiles.filter(f => f.status === 'ready').length + (formData.privacyUrl?.trim() ? 1 : 0) + (formData.termsUrl?.trim() ? 1 : 0)} training item{((formData.trainingText.trim() ? 1 : 0) + uploadedFiles.filter(f => f.status === 'ready').length + (formData.privacyUrl?.trim() ? 1 : 0) + (formData.termsUrl?.trim() ? 1 : 0)) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  };

  // Mini Preview Widget Component
  const renderUploadedFilesList = () => {
    if (currentStep !== 2 && currentStep !== 4) return null;

    const hasManualText = formData.trainingText.trim().length > 0;
    const hasPrivacyUrl = formData.privacyUrl?.trim();
    const hasTermsUrl = formData.termsUrl?.trim();
    const hasAnyContent = uploadedFiles.length > 0 || hasManualText || hasPrivacyUrl || hasTermsUrl;

    return (
      <div className="w-full">
        <div className="text-xs font-medium text-white mb-4 text-center">Training Content</div>

        {/* Content List */}
        <div className="space-y-3">
          {!hasAnyContent ? (
            <div className="w-full max-w-lg text-center py-8 px-4 text-neutral-400 text-sm bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              No training content added yet
            </div>
          ) : (
            <>
              {/* Uploaded Documents */}
              {uploadedFiles.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                  <div className="text-xs font-medium text-white/90 mb-2">📄 Documents</div>
                  <div className="space-y-1.5">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="text-xs text-white/70 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-green-400"></div>
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pasted Text */}
              {hasManualText && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                  <div className="text-xs font-medium text-white/90 mb-2">📝 Training Text</div>
                  <div className="text-xs text-white/70">
                    {formData.trainingText.length} characters
                  </div>
                </div>
              )}

              {/* Links */}
              {(hasPrivacyUrl || hasTermsUrl) && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                  <div className="text-xs font-medium text-white/90 mb-2">🔗 Policy Links</div>
                  <div className="space-y-1.5">
                    {hasPrivacyUrl && (
                      <div className="text-xs text-white/70 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                        <span className="truncate">Privacy Policy</span>
                      </div>
                    )}
                    {hasTermsUrl && (
                      <div className="text-xs text-white/70 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                        <span className="truncate">Terms of Service</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Step 4: Data Flow Animation */}
        {currentStep === 4 && hasAnyContent && (
          <div className="relative w-1 h-16 rounded-full mx-auto mt-6">
            {/* Static vertical line */}
            <div className="absolute inset-0 rounded-full bg-white/25"></div>

            {/* Flowing stream effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Multiple flowing streams for visibility */}
              <div
                className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white to-transparent animate-data-flow opacity-80"
                style={{ animationDelay: '0s' }}
              ></div>
              <div
                className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-white/90 to-transparent animate-data-flow opacity-70"
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div
                className="absolute inset-x-0 h-7 bg-gradient-to-b from-transparent via-white/80 to-transparent animate-data-flow opacity-75"
                style={{ animationDelay: '1s' }}
              ></div>
              <div
                className="absolute inset-x-0 h-5 bg-gradient-to-b from-transparent via-white/70 to-transparent animate-data-flow opacity-65"
                style={{ animationDelay: '1.5s' }}
              ></div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderPreviewWidget = () => {
    // Only show on Step 1, Step 3, and Step 4
    if (currentStep !== 1 && currentStep !== 3 && currentStep !== 4) return null;

    // On step 3, show popupForm preview, on other steps show saved popups
    const showPreview = currentStep === 3;
    const previewPopup = showPreview ? popupForm : (popups.length > 0 ? popups[0] : null);
    const hasPopup = showPreview || (popups.length > 0 && currentStep === 3);

    return (
      <div className="w-full">
        <div className="text-xs font-bold text-white mb-4 text-center">Live Preview</div>


        {/* Mini Widget */}
        <div className="relative mx-auto bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 backdrop-blur-md border border-neutral-700/50 rounded-3xl p-4 shadow-2xl" style={{width: '380px'}}>

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-700/50 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-8 h-8 object-cover rounded-xl" />
              ) : (
                <span className="text-sm">✨</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {formData.projectName || 'Your Agent'}
              </div>
              <div className="text-xs text-neutral-400">Online now</div>
            </div>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          </div>

          {/* Popup Preview (Step 3 only) - orchis-offer-banner style */}
          {hasPopup && previewPopup && (
            <div className="mb-3 px-3 py-2.5 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-0.5 h-8 bg-white rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold mb-0.5">
                    {previewPopup.title || 'Welcome! 👋'}
                  </div>
                  <div className="text-white/75 text-xs">
                    {previewPopup.contentType === 'discount' ? (
                      <>
                        {previewPopup.message || 'Get a special discount with code'}{' '}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(previewPopup.code || 'SAVE20');
                            showNotification('Promo code copied!', 'success');
                          }}
                          className="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <strong className="text-white font-bold font-mono">{previewPopup.code || 'SAVE20'}</strong>
                          <svg className="w-3 h-3 ml-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </>
                    ) : previewPopup.contentType === 'video' ? (
                      <a
                        href={previewPopup.videoUrl || 'https://www.youtube.com/watch?v=qU9mHegkTc4'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 mt-1 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <div
                          className="w-16 h-12 rounded flex-shrink-0 bg-cover bg-center"
                          style={{ backgroundImage: "url('/livepreview6.webp')" }}
                        >
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-semibold mb-0.5">Watch Now 🎥</div>
                          <div className="text-white/75 text-xs">{previewPopup.message || 'Check out this video'}</div>
                        </div>
                      </a>
                    ) : previewPopup.contentType === 'link' ? (
                      <div className="mt-1">
                        <div className="mb-1">{previewPopup.message || 'Check this out!'}</div>
                        <a
                          href={previewPopup.buttonLink || 'https://orchis.app'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-orange-400 text-xs hover:text-orange-300 transition-colors cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                          </svg>
                          <span className="truncate">{previewPopup.buttonLink?.replace(/^https?:\/\//, '') || 'example.com'}</span>
                        </a>
                      </div>
                    ) : (
                      <>{previewPopup.message || 'Your message will appear here...'}</>
                    )}
                  </div>
                </div>
                <button className="text-white/50 hover:text-white/80 text-lg leading-none flex-shrink-0">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="bg-white/5 rounded-2xl p-2 flex items-center gap-2">
            <input
              type="text"
              disabled
              placeholder={`Ask ${formData.projectName || 'anything'}...`}
              className="flex-1 bg-transparent text-xs text-neutral-300 placeholder:text-neutral-500 border-none outline-none"
            />
            <div className="px-3 py-1.5 bg-white/90 text-black rounded-full text-xs font-semibold">
              send
            </div>
          </div>

          {/* Powered by */}
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-neutral-400">
            <img src="https://orchis.app/logo.webp" alt="Orchis" className="w-3 h-3 rounded" />
            <span>Powered by <span className="font-bold">ORCHIS</span></span>
          </div>
        </div>

        {/* Info text */}
        <div className="mt-4 text-xs text-white/70 text-center">
          {currentStep === 1 && '👆 This is how your chatbot will appear'}
          {currentStep === 3 && '👆 Preview updates live as you select options'}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscriptionData?.plan}
        agentLimit={subscriptionData?.agentLimit}
        currentAgentCount={currentAgentCount}
      />

      {/* Split Card Container */}
      <div className="max-w-6xl mx-auto bg-neutral-500/3 dark:bg-neutral-500/3 rounded-2xl sm:rounded-3xl lg:rounded-4xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="p-4 sm:p-6 lg:p-10 flex flex-col min-h-[600px] lg:min-h-[700px]">
            {/* Back Button - Only show if user has other agents */}
            {agents && agents.length > 0 && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-2 py-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 mb-4 text-xs w-fit"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Cancel
              </button>
            )}
            {/* Welcome Message - Only show on Step 1 */}
            {currentStep === 1 && (
              <>
                {currentAgentCount === 0 ? (
                  <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                      Welcome, {user?.displayName || 'there'}! 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      Let's create your first AI Chatbot together. We're excited to have you on board and can't wait to see what you build!
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                      Create New Agent
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      Ready to expand your AI toolkit? Let's set up another intelligent agent to help your business grow.
                    </p>
                  </div>
                )}
              </>
            )}

            {renderStepIndicator()}

          <div className="bg-white dark:bg-neutral-800/50 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-3 sm:p-5 mb-4">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${currentStep === 1 ? 'sm:justify-end' : 'sm:justify-between'}`}>
            {!trainingComplete && currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="btn-secondary text-xs py-2 sm:py-1.5 px-3 rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Previous
              </button>
            )}

            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${trainingComplete ? 'w-full' : ''}`}>
              {/* Skip button for step 3 (Dynamic Contents) */}
              {currentStep === 3 && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn-secondary text-xs py-2 sm:py-1.5 px-3 rounded-xl inline-flex items-center justify-center gap-1.5"
                >
                  Skip for now
                </button>
              )}

              {currentStep < 4 && (
                <button
                  onClick={() => {
                    // Validate Step 2 training content
                    if (currentStep === 2) {
                      const totalTrainingContent = formData.trainingText.trim().length +
                        uploadedFiles.filter(f => f.status === 'ready').reduce((acc, f) => acc + (f.textContent?.length || 0), 0);

                      if (totalTrainingContent < 100) {
                        showNotification('Please provide at least 300 characters of training content (text or documents)', 'error');
                        return;
                      }
                    }

                    // Check limit when clicking Next from step 3
                    if (currentStep === 3 && subscriptionData) {
                      const { agentLimit } = subscriptionData;
                      if (agentLimit !== -1 && currentAgentCount >= agentLimit) {
                        setShowUpgradeModal(true);
                        return;
                      }
                    }
                    setCurrentStep(prev => Math.min(4, prev + 1));
                  }}
                  disabled={!canGoToNextStep()}
                  className="btn-primary text-xs py-2 sm:py-1.5 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              )}

              {currentStep === 4 && !trainingComplete && (
                <button
                  onClick={handleTrainAgent}
                  disabled={
                    isTraining ||
                    (formData.trainingText.trim().length === 0 && uploadedFiles.filter(f => f.status === 'ready').length === 0)
                  }
                  className="btn-primary text-xs py-2 sm:py-1.5 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
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
                      const embedCode = `<script src="https://orchis.app/chatbot-widget.js" data-agent-id="${createdAgentId}"></script>`;
                      navigator.clipboard.writeText(embedCode);
                      showNotification('Embed code copied to clipboard!', 'success');
                    }}
                    className="flex-1 btn-secondary text-xs py-2 rounded-xl inline-flex items-center justify-center gap-1.5"
                  >
                    Copy Embed Code
                  </button>
                  <button
                    onClick={() => {
                      console.log('🚀 Navigating to:', `/dashboard/${createdAgentId}`);
                      navigate(`/dashboard/${createdAgentId}`);
                    }}
                    className="flex-1 btn-primary text-xs py-2 rounded-xl inline-flex items-center justify-center gap-1.5"
                  >
                    Go to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
          </div>

          {/* Right Column - Preview */}
          <div
            className="hidden lg:flex flex-col items-center justify-center p-10 bg-cover bg-center bg-no-repeat relative min-h-[700px]"
            style={{backgroundImage: "url('/livepreview.webp')"}}
          >
            <div className="absolute inset-0 bg-neutral-900/20 dark:bg-neutral-900/30"></div>
            <div className="relative z-10 w-full max-w-[500px] mx-auto">
              {renderUploadedFilesList()}
              {renderPreviewWidget()}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
