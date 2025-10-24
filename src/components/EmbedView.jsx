import React, { useState, useEffect } from 'react';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BinaryCodeIcon,
  Tick01Icon,
  PencilEdit01Icon,
  Store01Icon,
  Copy01Icon,
  ArrowLeft01Icon,
  GiftIcon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  FolderLibraryIcon,
  FileUploadIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';


export default function EmbedView({ agent, onBack, initialSection = null }) {
  const { updateAgent } = useAgent();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [copied, setCopied] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    projectName: '',
    logoUrl: '',
    userIcon: 'alien'
  });
  const [securityForm, setSecurityForm] = useState({
    allowedDomains: ''
  });
  const [popups, setPopups] = useState([]);
  const [editingPopup, setEditingPopup] = useState(null);
  const [popupForm, setPopupForm] = useState({
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
  const [newLogo, setNewLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeSection, setActiveSection] = useState(initialSection || 'branding');
  const [alerts, setAlerts] = useState([]);
  const [trainingSources, setTrainingSources] = useState([]);
  const [loadingTrainingData, setLoadingTrainingData] = useState(false);
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [showDeleteRetrainModal, setShowDeleteRetrainModal] = useState(false);
  const [newTrainingText, setNewTrainingText] = useState('');
  const [retrainText, setRetrainText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [retrainUploadedFiles, setRetrainUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (agent) {
      setBrandingForm({
        projectName: agent.projectName || '',
        logoUrl: agent.logoUrl || '',
        userIcon: agent.userIcon || 'alien'
      });
      setSecurityForm({
        allowedDomains: agent.allowedDomains ? agent.allowedDomains.join('\n') : ''
      });
      setPopups(agent.popups || []);
      setLogoPreview(agent.logoUrl || null);
    }
  }, [agent]);

  // Set active section when initialSection changes
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Listen for alerts
  useEffect(() => {
    if (!user || !agent) return;

    const alertsRef = collection(db, 'users', user.uid, 'agents', agent.id, 'alerts');
    const q = query(alertsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, [user, agent]);

  // Load training data (chunks)
  useEffect(() => {
    if (!user || !agent) return;

    const loadTrainingData = async () => {
      setLoadingTrainingData(true);
      try {
        const chunksRef = collection(db, 'users', user.uid, 'agents', agent.id, 'chunks');
        const snapshot = await getDocs(chunksRef);

        // Group chunks by source
        const sourceMap = {};
        snapshot.forEach(doc => {
          const chunk = doc.data();
          const source = chunk.source || 'Unknown Source';

          if (!sourceMap[source]) {
            sourceMap[source] = {
              source: source,
              chunks: [],
              totalChunks: 0,
              totalChars: 0,
              fileType: chunk.metadata?.fileType || 'text/plain'
            };
          }

          sourceMap[source].chunks.push({ id: doc.id, ...chunk });
          sourceMap[source].totalChunks++;
          sourceMap[source].totalChars += (chunk.content?.length || 0);
        });

        setTrainingSources(Object.values(sourceMap));
      } catch (error) {
        console.error('Error loading training data:', error);
        showNotification('Error loading training data', 'error');
      } finally {
        setLoadingTrainingData(false);
      }
    };

    loadTrainingData();
  }, [user, agent, showNotification]);

  const embedCode = agent ? `<!-- Orchis Chatbot -->
<script>
(function(){
  if(!window.OrchisChatbot){
    const script = document.createElement('script');
    script.src = 'https://orchis.app/chatbot-widget.js';
    script.onload = function() {
      if(window.OrchisChatbot) {
        window.OrchisChatbot.init({
          agentId: '${agent.id}'
        });
      }
    };
    document.head.appendChild(script);
  }
})();
</script>` : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      showNotification('Embed code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  const handleBrandingSave = async () => {
    try {
      let logoUrlToSave = brandingForm.logoUrl;

      // If user uploaded a new logo, use the preview (base64)
      if (newLogo && logoPreview) {
        logoUrlToSave = logoPreview;
      }

      const updatedAgentData = {
        projectName: brandingForm.projectName,
        logoUrl: logoUrlToSave,
        userIcon: brandingForm.userIcon,
        updatedAt: new Date().toISOString()
      };

      // Update the agent using the context function
      await updateAgent(agent.id, updatedAgentData);

      setNewLogo(null);

      showNotification('Branding updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating branding:', error);
      showNotification('Error updating branding: ' + error.message, 'error');
    }
  };

  const handleSecuritySave = async () => {
    try {
      // Process allowed domains
      const allowedDomains = securityForm.allowedDomains
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

      const updatedAgentData = {
        allowedDomains: allowedDomains,
        updatedAt: new Date().toISOString()
      };

      // Update the agent using the context function
      await updateAgent(agent.id, updatedAgentData);

      showNotification('Security settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating security settings:', error);
      showNotification('Error updating security settings: ' + error.message, 'error');
    }
  };

  const handleAddPopup = () => {
    const newPopup = {
      id: Date.now().toString(),
      ...popupForm
    };
    const updatedPopups = [...popups, newPopup];
    setPopups(updatedPopups);
    savePopups(updatedPopups);

    // Reset form
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
  };

  const handleUpdatePopup = () => {
    const updatedPopups = popups.map(p =>
      p.id === editingPopup.id ? { ...popupForm, id: editingPopup.id } : p
    );
    setPopups(updatedPopups);
    savePopups(updatedPopups);
    setEditingPopup(null);

    // Reset form
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
  };

  const handleDeletePopup = (popupId) => {
    const updatedPopups = popups.filter(p => p.id !== popupId);
    setPopups(updatedPopups);
    savePopups(updatedPopups);
  };

  const handleEditPopup = (popup) => {
    setEditingPopup(popup);
    setPopupForm({
      trigger: popup.trigger,
      triggerValue: popup.triggerValue,
      contentType: popup.contentType,
      title: popup.title,
      message: popup.message,
      code: popup.code || 'FIRST20',
      discountPercent: popup.discountPercent || 20,
      buttonText: popup.buttonText || 'Get Discount',
      buttonLink: popup.buttonLink || '',
      videoUrl: popup.videoUrl || ''
    });
  };

  const savePopups = async (popupsData) => {
    try {
      const updatedAgentData = {
        popups: popupsData,
        updatedAt: new Date().toISOString()
      };

      await updateAgent(agent.id, updatedAgentData);

      showNotification('Popups updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating popups:', error);
      showNotification('Error updating popups: ' + error.message, 'error');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewLogo(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };


  const handleMarkAlertAsRead = async (alertId) => {
    if (!user || !agent) return;

    try {
      const alertRef = doc(db, 'users', user.uid, 'agents', agent.id, 'alerts', alertId);
      await updateDoc(alertRef, { read: true });
      showNotification('Alert marked as read', 'success');
    } catch (error) {
      console.error('Error marking alert as read:', error);
      showNotification('Error marking alert as read', 'error');
    }
  };

  const handleMarkAllAlertsAsRead = async () => {
    if (!user || !agent) return;

    try {
      const unreadAlerts = alerts.filter(alert => !alert.read);
      for (const alert of unreadAlerts) {
        const alertRef = doc(db, 'users', user.uid, 'agents', agent.id, 'alerts', alert.id);
        await updateDoc(alertRef, { read: true });
      }
      showNotification('All alerts marked as read', 'success');
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      showNotification('Error marking all alerts as read', 'error');
    }
  };

  // Delete training source (all chunks from a specific source)
  const handleDeleteTrainingSource = async (sourceName) => {
    if (!user || !agent) return;

    const confirmed = window.confirm(`Are you sure you want to delete all chunks from "${sourceName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoadingTrainingData(true);

      const chunksRef = collection(db, 'users', user.uid, 'agents', agent.id, 'chunks');
      const snapshot = await getDocs(chunksRef);

      const batch = writeBatch(db);
      let deleteCount = 0;

      snapshot.forEach(docSnapshot => {
        const chunk = docSnapshot.data();
        if (chunk.source === sourceName) {
          batch.delete(docSnapshot.ref);
          deleteCount++;
        }
      });

      await batch.commit();

      // Reload training data
      setTrainingSources(prev => prev.filter(s => s.source !== sourceName));

      showNotification(`Deleted ${deleteCount} chunks from "${sourceName}"`, 'success');
    } catch (error) {
      console.error('Error deleting training source:', error);
      showNotification('Error deleting training source: ' + error.message, 'error');
    } finally {
      setLoadingTrainingData(false);
    }
  };

  // Open delete & retrain modal
  const handleRetrainAll = () => {
    setShowDeleteRetrainModal(true);
  };

  // Delete all chunks and retrain with new data
  const handleDeleteAndRetrain = async () => {
    if (!user || !agent) return;

    const readyFiles = retrainUploadedFiles.filter(f => f.status === 'ready');
    const totalContent = retrainText.trim().length + readyFiles.reduce((acc, f) => acc + (f.textContent?.length || 0), 0);

    if (totalContent === 0) {
      showNotification('Please add some training data (text or files)', 'error');
      return;
    }

    try {
      setLoadingTrainingData(true);

      // Step 1: Delete all existing chunks
      const chunksRef = collection(db, 'users', user.uid, 'agents', agent.id, 'chunks');
      const snapshot = await getDocs(chunksRef);

      const batch = writeBatch(db);
      snapshot.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      console.log(`🗑️ Deleted ${snapshot.size} old chunks`);

      // Step 2: Combine text and file contents
      let combinedText = retrainText.trim();
      readyFiles.forEach(file => {
        if (file.textContent) {
          combinedText += '\n\n' + file.textContent;
        }
      });

      // Step 3: Train with new data immediately
      const { functions } = await import('../firebase');
      const { httpsCallable } = await import('firebase/functions');
      const addTrainingData = httpsCallable(functions, 'addTrainingData');

      await addTrainingData({
        agentId: agent.id,
        trainingText: combinedText
      });

      console.log('✅ Re-trained with new data');

      // Step 4: Update agent status
      await updateAgent(agent.id, {
        trainingStatus: 'trained',
        updatedAt: new Date().toISOString()
      });

      // Reload training data
      const newSnapshot = await getDocs(chunksRef);
      const sourceMap = {};
      newSnapshot.forEach(doc => {
        const chunk = doc.data();
        const source = chunk.source || 'Unknown Source';
        if (!sourceMap[source]) {
          sourceMap[source] = {
            source: source,
            chunks: [],
            totalChunks: 0,
            totalChars: 0,
            fileType: chunk.metadata?.fileType || 'text/plain'
          };
        }
        sourceMap[source].chunks.push({ id: doc.id, ...chunk });
        sourceMap[source].totalChunks++;
        sourceMap[source].totalChars += (chunk.content?.length || 0);
      });
      setTrainingSources(Object.values(sourceMap));

      showNotification('Successfully deleted old data and re-trained with new data!', 'success');
      setShowDeleteRetrainModal(false);
      setRetrainText('');
      setRetrainUploadedFiles([]);

    } catch (error) {
      console.error('Error in delete & retrain:', error);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setLoadingTrainingData(false);
    }
  };

  // Handle file upload for Add Data modal
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      const fileData = {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        textContent: null
      };

      setUploadedFiles(prev => [...prev, fileData]);

      try {
        // Upload to Firebase Storage
        const { storage } = await import('../firebase');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

        const storageRef = ref(storage, `training-files/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Process document to extract text
        const { functions } = await import('../firebase');
        const { httpsCallable } = await import('firebase/functions');
        const processDocument = httpsCallable(functions, 'processDocument');

        const result = await processDocument({
          agentId: 'temp',
          fileName: file.name,
          fileUrl: url
        });

        // Update file status
        setUploadedFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: 'ready', textContent: result.data.textContent } : f
        ));

      } catch (error) {
        console.error('File upload error:', error);
        setUploadedFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: 'error' } : f
        ));
        showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
      }
    }

    setIsUploading(false);
  };

  // Handle file upload for Retrain modal
  const handleRetrainFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      const fileData = {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        textContent: null
      };

      setRetrainUploadedFiles(prev => [...prev, fileData]);

      try {
        // Upload to Firebase Storage
        const { storage } = await import('../firebase');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

        const storageRef = ref(storage, `training-files/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Process document to extract text
        const { functions } = await import('../firebase');
        const { httpsCallable } = await import('firebase/functions');
        const processDocument = httpsCallable(functions, 'processDocument');

        const result = await processDocument({
          agentId: 'temp',
          fileName: file.name,
          fileUrl: url
        });

        // Update file status
        setRetrainUploadedFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: 'ready', textContent: result.data.textContent } : f
        ));

      } catch (error) {
        console.error('File upload error:', error);
        setRetrainUploadedFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: 'error' } : f
        ));
        showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
      }
    }

    setIsUploading(false);
  };

  // Add new training data (append to existing chunks)
  const handleAddTrainingData = async () => {
    if (!user || !agent) return;

    const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
    const totalContent = newTrainingText.trim().length + readyFiles.reduce((acc, f) => acc + (f.textContent?.length || 0), 0);

    if (totalContent === 0) {
      showNotification('Please add some training data (text or files)', 'error');
      return;
    }

    try {
      setLoadingTrainingData(true);

      // Combine text and file contents
      let combinedText = newTrainingText.trim();
      readyFiles.forEach(file => {
        if (file.textContent) {
          combinedText += '\n\n' + file.textContent;
        }
      });

      // Call backend to chunk and add embeddings
      const { functions } = await import('../firebase');
      const { httpsCallable } = await import('firebase/functions');
      const addTrainingData = httpsCallable(functions, 'addTrainingData');

      await addTrainingData({
        agentId: agent.id,
        trainingText: combinedText
      });

      showNotification('Training data added successfully!', 'success');
      setShowAddDataModal(false);
      setNewTrainingText('');
      setUploadedFiles([]);

      // Reload training data
      const chunksRef = collection(db, 'users', user.uid, 'agents', agent.id, 'chunks');
      const snapshot = await getDocs(chunksRef);
      const sourceMap = {};
      snapshot.forEach(doc => {
        const chunk = doc.data();
        const source = chunk.source || 'Unknown Source';
        if (!sourceMap[source]) {
          sourceMap[source] = {
            source: source,
            chunks: [],
            totalChunks: 0,
            totalChars: 0,
            fileType: chunk.metadata?.fileType || 'text/plain'
          };
        }
        sourceMap[source].chunks.push({ id: doc.id, ...chunk });
        sourceMap[source].totalChunks++;
        sourceMap[source].totalChars += (chunk.content?.length || 0);
      });
      setTrainingSources(Object.values(sourceMap));

    } catch (error) {
      console.error('Error adding training data:', error);
      showNotification('Error adding training data: ' + error.message, 'error');
    } finally {
      setLoadingTrainingData(false);
    }
  };


  const sections = [
    { id: 'branding', title: 'Branding', icon: Store01Icon },
    { id: 'training', title: 'Training Data', icon: FolderLibraryIcon },
    { id: 'security', title: 'Allowed Domains', icon: BinaryCodeIcon },
    { id: 'discounts', title: 'Dynamic Contents', icon: GiftIcon },
    { id: 'alerts', title: 'Security Alerts', icon: Alert02Icon },
    { id: 'embed', title: 'Embed Code', icon: Copy01Icon }
  ];

  const renderBrandingSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Agent Name
          </label>
          <input
            type="text"
            value={brandingForm.projectName}
            onChange={(e) => setBrandingForm({...brandingForm, projectName: e.target.value})}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-neutral-900 dark:text-neutral-100"
            placeholder="My Company"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-2">
            Project Logo
          </label>
          <div className="flex items-center space-x-3">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-10 h-10 rounded-lg object-cover border border-stone-200"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload-branding"
            />
            <label
              htmlFor="logo-upload-branding"
              className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
            >
              <HugeiconsIcon icon={Store01Icon} className="w-3 h-3" />
              Upload Logo
            </label>
          </div>
        </div>

        <div>

        </div>

        <div className="pt-4">
          <button
            onClick={handleBrandingSave}
            className="btn-primary text-sm py-2 px-4"
          >
            Save Branding
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-black dark:text-white mb-1">
            Allowed Domains
          </label>
          <textarea
            value={securityForm.allowedDomains}
            onChange={(e) => setSecurityForm({...securityForm, allowedDomains: e.target.value})}
            className="form-textarea bg-transparent text-black dark:text-white border border-stone-200 dark:border-stone-700 text-sm h-24"
            placeholder="example.com&#10;mysite.org&#10;*.mydomain.com"
            rows={4}
          />
          <p className="text-xs text-stone-500 mt-1">
            One domain per line. Use * for subdomains (*.example.com). Leave empty to allow all domains.
          </p>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-black dark:text-white mb-2">🔒 Security Features</h4>
          <ul className="text-xs text-black dark:text-white space-y-1">
            <li>• <strong>Domain Restriction:</strong> Widget only works on allowed domains</li>
            <li>• <strong>HMAC Security:</strong> Cryptographic signatures prevent unauthorized use</li>
            <li>• <strong>Replay Protection:</strong> Requests expire after 5 minutes</li>
          </ul>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSecuritySave}
            className="btn-primary text-sm py-2 px-4"
          >
            Save Security Settings
          </button>
        </div>
      </div>
    </div>
  );

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

  const renderDiscountsSection = () => (
    <div className="space-y-6">
      {/* Existing Popups List */}
      {popups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-black dark:text-white">Active Popups</h3>
          {popups.map((popup) => (
            <div key={popup.id} className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                      {getTriggerLabel(popup.trigger, popup.triggerValue)}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {getContentTypeLabel(popup.contentType)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-black dark:text-white">{popup.title}</p>
                  <p className="text-xs text-stone-500 mt-1">{popup.message}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditPopup(popup)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePopup(popup.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Popup Form */}
      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
        <h3 className="text-base font-semibold text-black dark:text-white mb-4">
          {editingPopup ? 'Edit Popup' : 'Add New Popup'}
        </h3>

        <div className="space-y-4">
          {/* Trigger Selection */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              When to show popup (Trigger)
            </label>
            <select
              value={popupForm.trigger}
              onChange={(e) => setPopupForm({...popupForm, trigger: e.target.value})}
              className="form-select text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-black dark:text-white rounded-lg w-full"
            >
              <option value="first_visit">First Visit - User visits for the first time</option>
              <option value="return_visit">Return Visit - User has been here before</option>
              <option value="exit_intent">Exit Intent - Mouse leaves the page</option>
              <option value="time_delay">Time Delay - After X seconds on page</option>
              <option value="scroll_depth">Scroll Depth - After scrolling X%</option>
            </select>
          </div>

          {/* Trigger Value */}
          {(popupForm.trigger === 'time_delay' || popupForm.trigger === 'scroll_depth') && (
            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                {popupForm.trigger === 'time_delay' ? 'Delay (seconds)' : 'Scroll Percentage (%)'}
              </label>
              <input
                type="number"
                value={popupForm.triggerValue}
                onChange={(e) => setPopupForm({...popupForm, triggerValue: parseInt(e.target.value)})}
                className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                placeholder={popupForm.trigger === 'time_delay' ? '3' : '50'}
                min={popupForm.trigger === 'time_delay' ? '1' : '10'}
                max={popupForm.trigger === 'time_delay' ? '300' : '100'}
              />
            </div>
          )}

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Content Type
            </label>
            <select
              value={popupForm.contentType}
              onChange={(e) => setPopupForm({...popupForm, contentType: e.target.value})}
              className="form-select text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-black dark:text-white rounded-lg w-full"
            >
              <option value="discount">Discount - Show discount code</option>
              <option value="announcement">Announcement - General message</option>
              <option value="video">Video - YouTube embed</option>
              <option value="link">Link - Button with redirect</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1">
              Title
            </label>
            <input
              type="text"
              value={popupForm.title}
              onChange={(e) => setPopupForm({...popupForm, title: e.target.value})}
              className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
              placeholder="Welcome! 👋"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-black dark:text-white mb-1">
              Message
            </label>
            <textarea
              value={popupForm.message}
              onChange={(e) => setPopupForm({...popupForm, message: e.target.value})}
              className="form-textarea bg-transparent text-black dark:text-white border border-stone-200 dark:border-stone-700 text-sm"
              placeholder="Your message here..."
              rows={3}
            />
          </div>

          {/* Discount Fields */}
          {popupForm.contentType === 'discount' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Discount Code
                </label>
                <input
                  type="text"
                  value={popupForm.code}
                  onChange={(e) => setPopupForm({...popupForm, code: e.target.value})}
                  className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white font-mono"
                  placeholder="SAVE20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  value={popupForm.discountPercent}
                  onChange={(e) => setPopupForm({...popupForm, discountPercent: parseInt(e.target.value)})}
                  className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                  placeholder="20"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}

          {/* Video Field */}
          {popupForm.contentType === 'video' && (
            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                YouTube Video URL
              </label>
              <input
                type="text"
                value={popupForm.videoUrl}
                onChange={(e) => setPopupForm({...popupForm, videoUrl: e.target.value})}
                className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* Link/Button Fields */}
          {(popupForm.contentType === 'link' || popupForm.contentType === 'announcement') && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={popupForm.buttonText}
                  onChange={(e) => setPopupForm({...popupForm, buttonText: e.target.value})}
                  className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                  placeholder="Learn More"
                />
              </div>
              {popupForm.contentType === 'link' && (
                <div>
                  <label className="block text-xs font-medium text-black dark:text-white mb-1">
                    Button Link URL
                  </label>
                  <input
                    type="text"
                    value={popupForm.buttonLink}
                    onChange={(e) => setPopupForm({...popupForm, buttonLink: e.target.value})}
                    className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                    placeholder="https://example.com/page"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {editingPopup ? (
              <>
                <button
                  onClick={handleUpdatePopup}
                  className="btn-primary text-sm py-2 px-4"
                >
                  Update Popup
                </button>
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
                  }}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleAddPopup}
                className="btn-primary text-sm py-2 px-4"
              >
                Add Popup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmbedSection = () => (
    <div className="space-y-6">
      {/* Copy Button */}
      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="btn-primary flex items-center gap-2"
        >
          {copied ? (
            <>
              <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
              Copy Code
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
          {embedCode}
        </pre>
      </div>

      {/* Installation Instructions */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
        <h4 className="text-sm font-bold text-black dark:text-white mb-2">Installation</h4>
        <ol className="text-xs text-black dark:text-white space-y-1 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Paste before the closing &lt;/body&gt; tag (not in &lt;head&gt;)</li>
          <li>The chatbot will appear automatically on your site</li>
          <li>Test on your website to ensure it's working</li>
        </ol>
        <div className="mt-2 text-xs font-bold text-black dark:text-white">
          💡 Place in body for better performance and SEO
        </div>
      </div>
    </div>
  );


  const renderTrainingDataSection = () => {
    const totalChunks = trainingSources.reduce((sum, s) => sum + s.totalChunks, 0);
    const totalChars = trainingSources.reduce((sum, s) => sum + s.totalChars, 0);

    return (
      <div className="space-y-6">
        {/* 3 Main Options */}
        <div className="space-y-4">
          {/* Option 1: Add New Data */}
          <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-1">Add New Training Data</h4>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Add new content without affecting existing chunks. Appends to your current training data.
                </p>
              </div>
              <button
                onClick={() => setShowAddDataModal(true)}
                className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
              >
                Add Data
              </button>
            </div>
          </div>

          {/* Option 2: Delete All & Re-train */}
          <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-1">Delete All & Re-train</h4>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Remove all training data and start fresh. Use when rebuilding your entire knowledge base.
                </p>
              </div>
              <button
                onClick={handleRetrainAll}
                disabled={loadingTrainingData || trainingSources.length === 0}
                className="btn-secondary text-xs py-2 px-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
            <div className="text-xs text-stone-500 mb-1">Total Sources</div>
            <div className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
              {trainingSources.length}
            </div>
          </div>
          <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
            <div className="text-xs text-stone-500 mb-1">Total Embedding Knowledge</div>
            <div className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
              {totalChunks}
            </div>
          </div>
        </div>

        {/* Training Sources List */}
        {loadingTrainingData ? (
          <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm text-stone-500">Loading training data...</p>
          </div>
        ) : trainingSources.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <HugeiconsIcon icon={FolderLibraryIcon} className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No training data yet</p>
            <p className="text-xs text-stone-400 mt-1">Upload documents in the agent creation page to train your agent</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-black dark:text-white">Training Sources</h3>
            {trainingSources.map((source, idx) => (
              <div key={idx} className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <HugeiconsIcon icon={FolderLibraryIcon} className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <p className="text-sm font-medium text-black dark:text-white">{source.source}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      <span>{source.totalChunks} chunks</span>
                      <span>•</span>
                      <span>{source.totalChars.toLocaleString()} characters</span>
                      <span>•</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        {source.fileType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteTrainingSource(source.source)}
                      disabled={loadingTrainingData}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAlertsSection = () => {
    const unreadAlerts = alerts.filter(alert => !alert.read);
    const readAlerts = alerts.filter(alert => alert.read);

    return (
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {unreadAlerts.length > 0 ? (
              <span className="text-red-500 font-medium">
                {unreadAlerts.length} unread alert{unreadAlerts.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span>No unread alerts</span>
            )}
          </div>
          {unreadAlerts.length > 0 && (
            <button
              onClick={handleMarkAllAlertsAsRead}
              className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-3 h-3" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <HugeiconsIcon icon={Alert02Icon} className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No security alerts yet</p>
            <p className="text-xs text-stone-400 mt-1">You'll be notified here when unauthorized access is attempted</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unread alerts */}
            {unreadAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <HugeiconsIcon icon={Alert02Icon} className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                        {alert.type === 'domain_blocked' ? '🚫 Unauthorized Domain Access' : 'Security Alert'}
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Domain: <span className="font-mono">{alert.requestDomain}</span>
                      </p>
                      {alert.message && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Message preview: "{alert.message}"
                        </p>
                      )}
                      <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkAlertAsRead(alert.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
                  >
                    Mark as read
                  </button>
                </div>
              </div>
            ))}

            {/* Read alerts */}
            {readAlerts.length > 0 && (
              <>
                <div className="text-xs text-stone-400 font-medium mt-6 mb-2">Read Alerts</div>
                {readAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-stone-100 dark:bg-stone-700 rounded-lg">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-4 h-4 text-stone-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                          {alert.type === 'domain_blocked' ? '🚫 Unauthorized Domain Access' : 'Security Alert'}
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                          Domain: <span className="font-mono">{alert.requestDomain}</span>
                        </p>
                        <p className="text-xs text-stone-500 mt-2">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Info box */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-black dark:text-white mb-2">ℹ️ About Security Alerts</h4>
          <ul className="text-xs text-black dark:text-white space-y-1">
            <li>• Alerts are triggered when someone tries to use your widget from an unauthorized domain</li>
            <li>• Configure allowed domains in the <strong>Security</strong> section</li>
            <li>• All blocked attempts are logged here for your review</li>
          </ul>
        </div>
      </div>
    );
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <HugeiconsIcon icon={BinaryCodeIcon} className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-2">No Agent Selected</h2>
          <p className="text-stone-600 dark:text-stone-400">Please select an agent to generate embed code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 p-2 text-stone-900 dark:text-stone-50 hover:text-stone-500 transition-colors rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 cursor-pointer"
            title="Back to Analytics"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
            <span className="text-xs text-stone-500">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-thin text-stone-900 dark:text-stone-50">Embed Settings</h1>
            <div className="w-12 h-px bg-stone-900 dark:bg-stone-100 mt-4"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Left Sidebar - Section Navigation */}
        <div className="w-64 bg-transparent p-1">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-1 px-4 py-2 text-left rounded-lg hover:bg-stone-800 dark:md:hover:bg-stone-100 hover:text-white dark:md:hover:text-stone-900 transition-colors group ${
                    activeSection === section.id ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-black' : ''
                  }`}
                >
                  <HugeiconsIcon 
                    icon={Icon} 
                    className={`w-4 h-4 transition-colors ${
                      activeSection === section.id ? 'text-white dark:text-black' : 'text-stone-500 group-hover:text-white dark:md:group-hover:text-stone-900'
                    }`} 
                  />
                  <span className={`text-sm font-medium transition-colors ${
                    activeSection === section.id ? 'text-white dark:text-black' : 'text-stone-900 dark:text-stone-50 dark:md:group-hover:text-stone-900 group-hover:text-white'
                  }`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content - Section Content */}
        <div className="flex-1 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="text-lg font-medium text-stone-900 dark:text-stone-50 mb-6">
            {sections.find(s => s.id === activeSection)?.title}
          </h2>
          
          {activeSection === 'branding' && renderBrandingSection()}
          {activeSection === 'training' && renderTrainingDataSection()}
          {activeSection === 'security' && renderSecuritySection()}
          {activeSection === 'discounts' && renderDiscountsSection()}
          {activeSection === 'alerts' && renderAlertsSection()}
          {activeSection === 'embed' && renderEmbedSection()}
        </div>
      </div>

      {/* Add Training Data Modal */}
      {showAddDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Add New Training Data</h3>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Upload Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-700 dark:file:text-stone-300 hover:file:bg-stone-200 dark:hover:file:bg-stone-700"
                />
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-stone-50 dark:bg-stone-800 rounded">
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className={`px-2 py-0.5 rounded ${
                          file.status === 'ready' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          file.status === 'uploading' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {file.status}
                        </span>
                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Training Text (Optional)</label>
                <textarea
                  value={newTrainingText}
                  onChange={(e) => setNewTrainingText(e.target.value)}
                  placeholder="Or paste your training content here (FAQ, product info, etc.)..."
                  className="w-full h-40 px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-black dark:text-white resize-none"
                />
                <p className="text-xs text-stone-500 mt-1">{newTrainingText.length} characters</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
                <p className="text-xs text-black dark:text-white">
                  💡 Upload files and/or paste text. All content will be chunked and embedded, then added to your existing training data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddTrainingData}
                disabled={loadingTrainingData || isUploading || (uploadedFiles.filter(f => f.status === 'ready').length === 0 && !newTrainingText.trim())}
                className="btn-primary text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingTrainingData ? 'Adding...' : isUploading ? 'Processing Files...' : 'Add Training Data'}
              </button>
              <button
                onClick={() => {
                  setShowAddDataModal(false);
                  setNewTrainingText('');
                  setUploadedFiles([]);
                }}
                disabled={loadingTrainingData || isUploading}
                className="btn-secondary text-xs py-2 px-4 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All & Retrain Modal */}
      {showDeleteRetrainModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Delete All & Re-train</h3>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">⚠️ Warning</p>
                <p className="text-xs text-red-800 dark:text-red-200">
                  This will permanently delete ALL existing training data ({trainingSources.reduce((sum, s) => sum + s.totalChunks, 0)} chunks from {trainingSources.length} sources) and replace it with your new training data below.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Upload Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleRetrainFileUpload}
                  className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-700 dark:file:text-stone-300 hover:file:bg-stone-200 dark:hover:file:bg-stone-700"
                />
                {retrainUploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {retrainUploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-stone-50 dark:bg-stone-800 rounded">
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className={`px-2 py-0.5 rounded ${
                          file.status === 'ready' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          file.status === 'uploading' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {file.status}
                        </span>
                        <button
                          onClick={() => setRetrainUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">New Training Data (Optional)</label>
                <textarea
                  value={retrainText}
                  onChange={(e) => setRetrainText(e.target.value)}
                  placeholder="Or paste your new training content here (FAQ, product info, etc.)..."
                  className="w-full h-40 px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-black dark:text-white resize-none"
                />
                <p className="text-xs text-stone-500 mt-1">{retrainText.length} characters</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
                <p className="text-xs text-black dark:text-white">
                  💡 Upload files and/or paste text. All old data will be deleted and your agent will be re-trained with the new content.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleDeleteAndRetrain}
                disabled={loadingTrainingData || isUploading || (retrainUploadedFiles.filter(f => f.status === 'ready').length === 0 && !retrainText.trim())}
                className="btn-primary text-xs text-white py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingTrainingData ? 'Deleting & Re-training...' : isUploading ? 'Processing Files...' : 'Delete All & Re-train'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteRetrainModal(false);
                  setRetrainText('');
                  setRetrainUploadedFiles([]);
                }}
                disabled={loadingTrainingData || isUploading}
                className="btn-secondary text-xs py-2 px-4 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}