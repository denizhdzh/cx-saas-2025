import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAgent } from '../contexts/AgentContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import Sidebar from '../components/Sidebar';
import { 
  CodeBracketIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import ChatWidget from '../components/ChatWidget';

export default function EmbedPage() {
  const { selectedAgent } = useAgent();
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateEmbedCode = httpsCallable(functions, 'generateEmbedCode');

  useEffect(() => {
    if (selectedAgent) {
      handleGenerateEmbed();
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

  return (
    <>
      <Helmet>
        <title>Embed Code - Orchis</title>
        <meta name="description" content="Get embed code for your chatbot" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="border-b border-neutral-200 pb-8">
              <div className="text-xs text-neutral-400 mb-8">Integration</div>
              <h1 className="text-2xl font-thin text-neutral-900">Embed Chatbot</h1>
              <div className="w-12 h-px bg-neutral-900 mt-4 mb-6"></div>
              <p className="text-neutral-600 text-sm leading-relaxed font-light">
                Add your trained chatbot to any website with a simple code snippet.
              </p>
            </div>

            {!selectedAgent ? (
              <div className="text-center py-12">
                <CodeBracketIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Agent Selected</h2>
                <p className="text-gray-600">Please select an agent to generate embed code.</p>
              </div>
            ) : (
              <>
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
            <p className="text-sm text-gray-500">
              {selectedAgent.documentCount} documents • {selectedAgent.trainingStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Embed Code</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!embedCode}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderWidth: '0.5px',
                borderStyle: 'solid',
                borderColor: 'rgb(20, 20, 20)',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
              }}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Generating embed code...</p>
          </div>
        ) : embedCode ? (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {embedCode}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600">Click "Generate Code" to create your embed snippet.</p>
          </div>
        )}
      </div>

      {/* Configuration Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Customization Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <input 
              type="color" 
              defaultValue="#2563eb"
              className="w-full border border-gray-300 rounded-md h-10"
            />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Installation Instructions</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Copy the embed code above</li>
            <li>Paste it into your website's HTML, preferably before the closing &lt;/body&gt; tag</li>
            <li>The chatbot will automatically appear on your website</li>
            <li>Test the integration to ensure it's working properly</li>
          </ol>
        </div>
      </div>

      {/* Preview */}
      {showPreview && selectedAgent && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
          <div className="relative bg-gray-100 rounded-lg p-8 min-h-[300px]">
            <p className="text-gray-600 text-center mb-4">
              This is how your chatbot will appear on your website:
            </p>
            <ChatWidget 
              agentId={selectedAgent.id}
              projectName={selectedAgent.projectName}
              primaryColor="#2563eb"
              position="bottom-right"
            />
          </div>
        </div>
      )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}