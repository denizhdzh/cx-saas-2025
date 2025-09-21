import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CpuChipIcon, Cog6ToothIcon, SparklesIcon, PaintBrushIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import { useAgent } from '../contexts/AgentContext';

export default function ConfigurationPage() {
  const { selectedAgent, updateAgent } = useAgent();
  const [temperature, setTemperature] = useState(0);

  useEffect(() => {
    if (!selectedAgent) {
      window.location.href = '/dashboard';
    }
  }, [selectedAgent]);

  const SettingSection = ({ icon: Icon, title, children }) => (
    <div className="border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  if (!selectedAgent) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">No agent selected. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{selectedAgent.name} Configuration - Orchis</title>
        <meta name="description" content="Configure your AI assistant settings and behavior" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 flex h-screen">
          {/* Left Panel - Configuration */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-xs cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Back to Dashboard
              </button>
              <div className="text-xs text-gray-400 mb-2">Configuration</div>
              <h1 className="text-2xl font-thin text-gray-900">{selectedAgent.name}</h1>
              <div className="w-12 h-px bg-gray-900 mt-4"></div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Agent Info */}
              <SettingSection icon={CpuChipIcon} title="Agent Details">
                <SettingRow 
                  label="Name"
                  description="Agent display name"
                >
                  <div className="text-sm text-gray-600">
                    {selectedAgent.name}
                  </div>
                </SettingRow>
                <SettingRow 
                  label="Type"
                  description="Agent specialization"
                >
                  <div className="text-sm text-gray-600 capitalize">
                    {selectedAgent.type?.replace('_', ' ') || 'General'}
                  </div>
                </SettingRow>
                <SettingRow 
                  label="Status"
                  description="Current training status"
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAgent.trainingStatus === 'trained' ? 'bg-green-100 text-green-800' :
                    selectedAgent.trainingStatus === 'training' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedAgent.trainingStatus === 'trained' ? 'Trained' : 
                     selectedAgent.trainingStatus === 'training' ? 'Training' : 'Not Trained'}
                  </span>
                </SettingRow>
                <SettingRow 
                  label="Documents"
                  description="Training documents count"
                >
                  <div className="text-sm text-gray-600">
                    {selectedAgent.documentCount || 0} docs
                  </div>
                </SettingRow>
              </SettingSection>

              {/* Model Configuration */}
              <SettingSection icon={Cog6ToothIcon} title="Model Settings">
                <SettingRow 
                  label="Temperature"
                  description="Controls response creativity (0.0 = precise, 1.0 = creative)"
                >
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{temperature.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    />
                  </div>
                </SettingRow>
              </SettingSection>

              {/* Instructions */}
              <SettingSection icon={DocumentTextIcon} title="Instructions">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">System Instructions</label>
                  <textarea
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-gray-900 transition-colors resize-none font-mono bg-white"
                    rows={12}
                    defaultValue={`### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.`}
                  />
                </div>
              </SettingSection>

              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                  Save Configuration
                </button>
                <button 
                  onClick={() => window.location.href = '/train?mode=add-docs&agent=' + selectedAgent.id}
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Add Training Documents
                </button>
              </div>

            </div>
          </div>

          {/* Right Panel - Chatbot Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-medium text-gray-900">Live Preview</h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedAgent.trainingStatus === 'trained' ? 'Chat with your configured agent' : 
                 'Train your agent to enable chat preview'}
              </p>
            </div>

            {/* Chat Preview Area */}
            <div className="flex-1 flex flex-col">
              {selectedAgent.trainingStatus !== 'trained' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <CpuChipIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Agent Not Ready</div>
                    <div className="text-xs text-gray-500 max-w-xs">
                      Train your agent with documents to enable the chat preview
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center overflow-hidden">
                  <main className="z-20 h-full w-full items-center justify-center md:mx-auto md:my-auto md:max-h-[45rem] md:max-w-[25.5rem]">
                    <div className="flex h-[80vh] w-full flex-col justify-center md:h-full">
                      <div className="flex h-full w-full flex-col">
                        <div className="h-full w-full overflow-hidden border-[1px] border-zinc-100 md:rounded-[20px]">
                          <main className="group relative flex h-full flex-col bg-white shadow-sm backdrop-blur-sm">
                            {/* Header */}
                            <header className="relative flex items-center justify-between px-5 text-black bg-white">
                              <div className="my-4 flex h-10 items-center">
                                <div className="flex flex-col justify-center gap-px">
                                  <h1 className="font-medium text-sm tracking-tight">{selectedAgent.name}</h1>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm transition-all duration-200 h-9 w-9 rounded-md p-1.5 text-inherit opacity-70 hover:opacity-85">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="p-0.5 transition-transform duration-700 ease-in-out hover:rotate-180">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                    <path d="M21 3v5h-5"></path>
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                    <path d="M8 16H3v5"></path>
                                  </svg>
                                </button>
                              </div>
                            </header>

                            {/* Messages Container */}
                            <div className="-mb-2 relative flex-1 basis-full overflow-y-hidden scroll-smooth flex flex-col shadow-inner">
                              <div className="flex w-full flex-1 flex-col space-y-3 overflow-y-auto px-5 pt-5">
                                <div className="flex flex-1 flex-col gap-5">
                                  <div className="relative flex w-full max-w-full flex-col items-baseline gap-1">
                                    <div className="group/message relative w-full">
                                      <div className="flex w-full">
                                        <div className="group/message flex w-full flex-col items-start gap-1 min-h-full">
                                          <div className="relative w-full max-w-[min(calc(100%-40px),65ch)] pr-3">
                                            <div className="max-w-full overflow-hidden">
                                              <div className="hyphens-auto whitespace-normal text-wrap break-words text-left text-sm leading-5 antialiased relative flex w-fit max-w-full flex-col items-start gap-2 px-4 py-3 bg-zinc-200/50 text-zinc-800 rounded-[20px]">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-sm text-zinc-950 leading-normal tracking-tight">{selectedAgent.name}</span>
                                                </div>
                                                <div className="w-full text-sm text-zinc-800 leading-normal tracking-tight">
                                                  <p>Hi! What can I help you with?</p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Input Area */}
                            <div className="relative z-50 flex shrink-0 flex-col justify-end">
                              <div className="mt-0.5 mb-4 items-center justify-center gap-2 bg-white text-xs text-zinc-400">
                                <p className="flex items-center justify-center shrink-0">
                                  <span className="ml-1">Powered by Orchis</span>
                                </p>
                              </div>
                              <div className="flex-row items-center px-4 py-2.5 relative z-50 mx-4 mb-4 flex min-h-13 rounded-2xl bg-white border-[1.5px] border-zinc-100 shadow-sm focus-within:border-[1.5px] focus-within:border-zinc-950">
                                <textarea 
                                  className="flex w-full rounded-md bg-transparent text-base transition-color max-h-40 min-h-5 resize-none border-0 px-1 py-0 outline-none text-zinc-950 placeholder:text-zinc-400 text-sm flex-1"
                                  placeholder="Message..."
                                  rows="1"
                                  disabled
                                />
                                <div className="flex flex-row gap-1">
                                  <button className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm transition-all duration-200 rounded-md p-1.5 h-7 w-7 bg-transparent shadow-none hover:bg-zinc-100/90" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" className="size-5 text-zinc-700">
                                      <path stroke="#71717A" d="M7.5 8.333v.834m5-.834v.834m-5.476 2.916A4.154 4.154 0 0 0 10 13.333c1.165 0 2.22-.478 2.976-1.25M10 17.625a7.625 7.625 0 1 1 0-15.25 7.625 7.625 0 0 1 0 15.25Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <button className="flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm transition-all duration-200 rounded-md p-1.5 h-7 w-7 bg-transparent shadow-none hover:bg-zinc-100/90" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="size-5 text-zinc-700">
                                      <path fill="currentColor" d="M15.44 1.68c.69-.05 1.47.08 2.13.74.66.67.8 1.45.75 2.14-.03.47-.15 1-.25 1.4l-.09.35a43.7 43.7 0 0 1-3.83 10.67A2.52 2.52 0 0 1 9.7 17l-1.65-3.03a.83.83 0 0 1 .14-1l3.1-3.1a.83.83 0 1 0-1.18-1.17l-3.1 3.1a.83.83 0 0 1-.99.14L2.98 10.3a2.52 2.52 0 0 1 .04-4.45 43.7 43.7 0 0 1 11.02-3.9c.4-.1.92-.23 1.4-.26Z"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </main>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}