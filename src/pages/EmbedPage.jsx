import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import Sidebar from '../components/Sidebar';
import { 
  CodeBracketIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import ChatWidget from '../components/ChatWidget';

export default function EmbedPage() {
  const { selectedAgent, updateAgent } = useAgent();
  const { user } = useAuth();
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    projectName: '',
    logoUrl: ''
  });
  const [newLogo, setNewLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const generateEmbedCode = httpsCallable(functions, 'generateEmbedCode');

  useEffect(() => {
    if (selectedAgent) {
      handleGenerateEmbed();
      setEditForm({
        name: selectedAgent.name || '',
        projectName: selectedAgent.projectName || '',
        logoUrl: selectedAgent.logoUrl || ''
      });
      setLogoPreview(selectedAgent.logoUrl || null);
    }
  }, [selectedAgent]);

  const handleGenerateEmbed = async () => {
    if (!selectedAgent) return;
    
    setIsLoading(true);
    try {
      const result = await generateEmbedCode({ agentId: selectedAgent.id });
      setEmbedCode(result.data.embedCode);
    } catch (error) {
      console.error('Error generating embed code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEditSubmit = async () => {
    try {
      let logoUrlToSave = editForm.logoUrl;
      
      // If user uploaded a new logo, use the preview (base64)
      if (newLogo && logoPreview) {
        logoUrlToSave = logoPreview;
      }
      
      const updatedAgentData = {
        name: editForm.name,
        projectName: editForm.projectName,
        logoUrl: logoUrlToSave,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updating agent with:', updatedAgentData);
      
      // Update the agent using the context function
      await updateAgent(selectedAgent.id, updatedAgentData);
      
      setIsEditing(false);
      setNewLogo(null);
      
      // Regenerate embed code with new data
      await handleGenerateEmbed();
      
      alert('✅ Agent updated successfully!');
    } catch (error) {
      console.error('❌ Error updating agent:', error);
      alert('Error updating agent: ' + error.message);
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

  const handleEditCancel = () => {
    setEditForm({
      name: selectedAgent.name || '',
      projectName: selectedAgent.projectName || '',
      logoUrl: selectedAgent.logoUrl || ''
    });
    setNewLogo(null);
    setLogoPreview(selectedAgent.logoUrl || null);
    setIsEditing(false);
  };

  if (!selectedAgent) {
    return (
      <>
        <Helmet>
          <title>Embed Code - Orchis</title>
          <meta name="description" content="Get embed code for your chatbot" />
        </Helmet>
        
        <div className="min-h-screen bg-white">
          <Sidebar />
          
          <div className="ml-64 flex items-center justify-center h-screen">
            <div className="text-center">
              <CodeBracketIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Agent Selected</h2>
              <p className="text-neutral-600">Please select an agent to generate embed code.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Embed Code - Orchis</title>
        <meta name="description" content="Get embed code for your chatbot" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 flex h-screen">
          {/* Left Side - Agent Info & Embed Code */}
          <div className="w-96 border-r border-neutral-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <div className="text-xs text-neutral-400 mb-8">Integration</div>
              <h1 className="text-2xl font-thin text-neutral-900">
                Embed Chatbot
              </h1>
              <div className="w-12 h-px bg-neutral-900 mt-4"></div>
            </div>

            {/* Agent Info */}
            <div className="p-6 border-b border-neutral-200">
              {!isEditing ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedAgent.logoUrl ? (
                      <img 
                        src={selectedAgent.logoUrl} 
                        alt={selectedAgent.projectName}
                        className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <CodeBracketIcon className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-medium text-neutral-900">{selectedAgent.name}</h2>
                      <p className="text-neutral-600 text-sm">{selectedAgent.projectName}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {selectedAgent.documentCount} documents • {selectedAgent.trainingStatus}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="Edit agent settings"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-700">Edit Agent Settings</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="form-input text-sm"
                      placeholder="Customer Support Bot"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={editForm.projectName}
                      onChange={(e) => setEditForm({...editForm, projectName: e.target.value})}
                      className="form-input text-sm"
                      placeholder="My Company"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">
                      Project Logo
                    </label>
                    <div className="flex items-center space-x-3">
                      {logoPreview && (
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload-edit"
                      />
                      <label
                        htmlFor="logo-upload-edit"
                        className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
                      >
                        <PhotoIcon className="w-3 h-3" />
                        Upload Logo
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleEditSubmit}
                      className="btn-primary text-xs py-2 px-3 flex-1"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="btn-secondary text-xs py-2 px-3 flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Embed Code Section */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div>
                <button
                  onClick={() => setShowEmbedCode(!showEmbedCode)}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-sm font-medium text-neutral-700">Embed Code</h3>
                  {showEmbedCode ? (
                    <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                
                {/* Copy Button - Always Visible */}
                {isLoading ? (
                  <div className="bg-neutral-50 rounded-lg p-4 text-center mb-4">
                    <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full mx-auto mb-2"></div>
                    <p className="text-neutral-600 text-sm">Generating...</p>
                  </div>
                ) : embedCode ? (
                  <button
                    onClick={copyToClipboard}
                    className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Copy Embed Code
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-neutral-50 rounded-lg p-4 text-center mb-4">
                    <p className="text-neutral-600 text-sm">Ready to copy embed code</p>
                  </div>
                )}
                
                {/* Collapsible Code Display */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showEmbedCode ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  {embedCode && (
                    <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Installation Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Installation</h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Copy the embed code above</li>
                  <li>Paste before the closing &lt;/body&gt; tag (not in &lt;head&gt;)</li>
                  <li>The chatbot will appear automatically on your site</li>
                  <li>Test on your website to ensure it's working</li>
                </ol>
                <div className="mt-2 text-xs text-blue-600">
                  💡 Place in body for better performance and SEO
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Live Preview</h2>
              <p className="text-sm text-neutral-600 mt-1">
                See how your chatbot will appear on your website
              </p>
            </div>

            {/* Preview Area */}
            <div className="flex-1 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
              
              {/* Try Here Message */}
              <div className="absolute top-20 left-8 z-10">
                <div className="flex items-center gap-2 text-neutral-500">
                  <span className="text-sm font-medium">Try here</span>
                  <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="relative h-full p-6 flex items-center justify-center">
                {/* Chat Widget */}
                <div className="w-full max-w-md">
                  <ChatWidget 
                    agentId={selectedAgent.id}
                    projectName={selectedAgent.projectName}
                    logoUrl={selectedAgent.logoUrl}
                    primaryColor="#2563eb"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}