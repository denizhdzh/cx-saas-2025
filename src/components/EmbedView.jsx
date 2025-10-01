import React, { useState, useEffect } from 'react';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  BinaryCodeIcon, 
  AirplayLineIcon, 
  Tick01Icon,
  PencilEdit01Icon,
  Store01Icon,
  Copy01Icon,
  ArrowLeft01Icon
} from '@hugeicons/core-free-icons';
import ChatWidget from './ChatWidget';

export default function EmbedView({ agent, onBack }) {
  const { updateAgent } = useAgent();
  const { user } = useAuth();
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    projectName: '',
    logoUrl: ''
  });
  const [newLogo, setNewLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeSection, setActiveSection] = useState('branding');
  
  const generateEmbedCode = httpsCallable(functions, 'generateEmbedCode');

  useEffect(() => {
    if (agent) {
      handleGenerateEmbed();
      setEditForm({
        name: agent.name || '',
        projectName: agent.projectName || '',
        logoUrl: agent.logoUrl || ''
      });
      setLogoPreview(agent.logoUrl || null);
    }
  }, [agent]);

  const handleGenerateEmbed = async () => {
    if (!agent) return;
    
    setIsLoading(true);
    try {
      const result = await generateEmbedCode({ agentId: agent.id });
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
      await updateAgent(agent.id, updatedAgentData);
      
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
      name: agent.name || '',
      projectName: agent.projectName || '',
      logoUrl: agent.logoUrl || ''
    });
    setNewLogo(null);
    setLogoPreview(agent.logoUrl || null);
    setIsEditing(false);
  };

  const sections = [
    { id: 'branding', title: 'Branding', icon: Store01Icon },
    { id: 'embed', title: 'Embed Code', icon: BinaryCodeIcon },
    { id: 'preview', title: 'Preview', icon: AirplayLineIcon }
  ];

  const renderBrandingSection = () => (
    <div className="space-y-6">
      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agent.logoUrl ? (
              <img 
                src={agent.logoUrl} 
                alt={agent.projectName}
                className="w-12 h-12 rounded-lg object-cover border border-stone-200"
              />
            ) : (
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <HugeiconsIcon icon={BinaryCodeIcon} className="w-6 h-6 text-stone-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-medium text-stone-900">{agent.name}</h2>
              <p className="text-stone-600 text-sm">{agent.projectName}</p>
              <p className="text-xs text-stone-500 mt-1">
                {agent.documentCount} documents • {agent.trainingStatus}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
            title="Edit agent settings"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-700">Edit Agent Settings</h3>
          
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
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
            <label className="block text-xs font-medium text-stone-600 mb-1">
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
            <label className="block text-xs font-medium text-stone-600 mb-2">
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
                id="logo-upload-edit"
              />
              <label
                htmlFor="logo-upload-edit"
                className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
              >
                <HugeiconsIcon icon={Store01Icon} className="w-3 h-3" />
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
  );

  const renderEmbedSection = () => (
    <div className="space-y-6">
      {/* Copy Button */}
      {isLoading ? (
        <div className="bg-stone-50 rounded-lg p-4 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full mx-auto mb-2"></div>
          <p className="text-stone-600 text-sm">Generating...</p>
        </div>
      ) : embedCode ? (
        <button
          onClick={copyToClipboard}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
              Copy Embed Code
            </>
          )}
        </button>
      ) : (
        <div className="bg-stone-50 rounded-lg p-4 text-center">
          <p className="text-stone-600 text-sm">Ready to copy embed code</p>
        </div>
      )}

      {/* Code Display */}
      {embedCode && (
        <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
            {embedCode}
          </pre>
        </div>
      )}

      {/* Installation Instructions */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-orange-800 mb-2">Installation</h4>
        <ol className="text-xs text-orange-700 space-y-1 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Paste before the closing &lt;/body&gt; tag (not in &lt;head&gt;)</li>
          <li>The chatbot will appear automatically on your site</li>
          <li>Test on your website to ensure it's working</li>
        </ol>
        <div className="mt-2 text-xs text-orange-600">
          💡 Place in body for better performance and SEO
        </div>
      </div>
    </div>
  );

  const renderPreviewSection = () => (
    <div className="space-y-6">
      <div className="text-sm text-stone-600">
        See how your chatbot will appear on your website
      </div>
      
      {/* Preview Area */}
      <div className="relative overflow-hidden border border-stone-200 rounded-lg" style={{ height: '500px' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
        
        {/* Try Here Message */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 text-stone-500">
            <span className="text-sm font-medium">Try here</span>
            <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
        
        {/* Preview Content */}
        <div className="relative h-full p-6 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ChatWidget 
              agentId={agent.id}
              projectName={agent.projectName}
              logoUrl={agent.logoUrl}
              primaryColor="#f97316"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <HugeiconsIcon icon={BinaryCodeIcon} className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">No Agent Selected</h2>
          <p className="text-stone-600">Please select an agent to generate embed code.</p>
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
            className="flex items-center gap-2 p-2 text-stone-400 hover:text-stone-600 transition-colors rounded-lg hover:bg-stone-200 cursor-pointer"
            title="Back to Analytics"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
            <span className="text-xs text-stone-400">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-thin text-stone-900">Embed Settings</h1>
            <div className="w-12 h-px bg-stone-900 mt-4"></div>
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
                  className={`w-full flex items-center gap-1 px-4 py-2 text-left rounded-lg hover:bg-stone-800 hover:text-white transition-colors group ${
                    activeSection === section.id ? 'bg-stone-800 text-white' : ''
                  }`}
                >
                  <HugeiconsIcon 
                    icon={Icon} 
                    className={`w-4 h-4 transition-colors ${
                      activeSection === section.id ? 'text-white' : 'text-stone-500 group-hover:text-white'
                    }`} 
                  />
                  <span className={`text-sm font-medium transition-colors ${
                    activeSection === section.id ? 'text-white' : 'text-stone-900 group-hover:text-white'
                  }`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content - Section Content */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-lg font-medium text-stone-900 mb-6">
            {sections.find(s => s.id === activeSection)?.title}
          </h2>
          
          {activeSection === 'branding' && renderBrandingSection()}
          {activeSection === 'embed' && renderEmbedSection()}
          {activeSection === 'preview' && renderPreviewSection()}
        </div>
      </div>
    </div>
  );
}