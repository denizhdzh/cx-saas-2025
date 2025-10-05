import React, { useState, useEffect } from 'react';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
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
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';
import ChatWidget from './ChatWidget';


export default function EmbedView({ agent, onBack }) {
  const { updateAgent } = useAgent();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    name: '',
    projectName: '',
    logoUrl: '',
    userIcon: 'alien'
  });
  const [securityForm, setSecurityForm] = useState({
    allowedDomains: ''
  });
  const [newLogo, setNewLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeSection, setActiveSection] = useState('branding');
  
  const generateEmbedCode = httpsCallable(functions, 'generateEmbedCode');

  useEffect(() => {
    if (agent) {
      setBrandingForm({
        name: agent.name || '',
        projectName: agent.projectName || '',
        logoUrl: agent.logoUrl || '',
        userIcon: agent.userIcon || 'alien'
      });
      setSecurityForm({
        allowedDomains: agent.allowedDomains ? agent.allowedDomains.join('\n') : ''
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
      showNotification('Embed code generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating embed code:', error);
      showNotification('Error generating embed code: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
        name: brandingForm.name,
        projectName: brandingForm.projectName,
        logoUrl: logoUrlToSave,
        userIcon: brandingForm.userIcon,
        updatedAt: new Date().toISOString()
      };

      // Update the agent using the context function
      await updateAgent(agent.id, updatedAgentData);

      setNewLogo(null);
      setEmbedCode(''); // Clear old embed code

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

      setEmbedCode(''); // Clear old embed code

      showNotification('Security settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating security settings:', error);
      showNotification('Error updating security settings: ' + error.message, 'error');
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


  const sections = [
    { id: 'branding', title: 'Branding', icon: Store01Icon },
    { id: 'security', title: 'Security', icon: BinaryCodeIcon },
    { id: 'embed', title: 'Embed Code', icon: Copy01Icon },
    { id: 'preview', title: 'Preview', icon: AirplayLineIcon }
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
            value={brandingForm.name}
            onChange={(e) => setBrandingForm({...brandingForm, name: e.target.value})}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-neutral-900 dark:text-neutral-100"
            placeholder="Customer Support Bot"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Project Name
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

  const renderEmbedSection = () => (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerateEmbed}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full"></div>
              Generating...
            </>
          ) : (
            <>
              <HugeiconsIcon icon={BinaryCodeIcon} className="w-4 h-4" />
              Generate Embed Code
            </>
          )}
        </button>
        
        {embedCode && (
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
        )}
      </div>

      {/* Code Display */}
      {embedCode && (
        <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
            {embedCode}
          </pre>
        </div>
      )}

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

  const renderPreviewSection = () => (
    <div className="space-y-6">
      <div className="text-sm text-stone-600 dark:text-stone-400">
        See how your chatbot will appear on your website
      </div>

      {/* Preview Area */}
      <div className="relative overflow-hidden border border-stone-200 dark:border-stone-700 rounded-lg" style={{ height: '500px' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 h-full w-full bg-white dark:bg-stone-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#404040_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

        {/* Try Here Message */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 text-orange-500">
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
              userIcon={agent.userIcon || brandingForm.userIcon}
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
          {activeSection === 'security' && renderSecuritySection()}
          {activeSection === 'embed' && renderEmbedSection()}
          {activeSection === 'preview' && renderPreviewSection()}
        </div>
      </div>
    </div>
  );
}