import React, { useState } from 'react';
import { PlusIcon, CpuChipIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import { useAgent } from '../contexts/AgentContext';

export default function DashboardPage() {
  const { agents, deleteAgent, selectAgent, loading } = useAgent();

  const handleCreateAgent = () => {
    // Navigate to create agent page
    window.location.href = '/create-agent';
  };

  const handleDeleteAgent = async (agentId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await deleteAgent(agentId);
      } catch (error) {
        console.error('Error deleting agent:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrainingStatusColor = (status) => {
    switch (status) {
      case 'trained': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'not_trained': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Agents - Orchis</title>
        <meta name="description" content="Manage and train your AI assistants" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64 flex h-screen">
          {/* Left Sidebar - Agent List */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="text-xs text-gray-400 mb-2">Dashboard</div>
              <h1 className="text-lg font-medium text-gray-900">AI Agents</h1>
            </div>

            {/* Create Button */}
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={handleCreateAgent}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Create Agent
              </button>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto">
              {agents.length === 0 ? (
                <div className="p-6 text-center">
                  <CpuChipIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <div className="text-sm font-medium text-gray-900 mb-1">No agents yet</div>
                  <div className="text-xs text-gray-500">Create your first AI agent</div>
                </div>
              ) : (
                <div className="p-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors mb-1"
                      onClick={() => {
                        selectAgent(agent);
                        window.location.href = '/edit-agent';
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CpuChipIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{agent.name}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{agent.description}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTrainingStatusColor(agent.trainingStatus)}`}>
                              {agent.trainingStatus?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">{agent.documentCount || 0} docs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Agent Details */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CpuChipIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an agent</h3>
              <p className="text-gray-600">Choose an agent from the list to view details and start training</p>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}