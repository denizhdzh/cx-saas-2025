import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import AgentDashboard from '../components/AgentDashboard';
import EmbedView from '../components/EmbedView';
import PricingDashboard from '../components/PricingDashboard';
import { useAgent } from '../contexts/AgentContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const isBillingPage = agentId === 'billing';
  const { agents, deleteAgent, selectAgent, selectedAgent, loading } = useAgent();
  const [showEmbedView, setShowEmbedView] = useState(false);

  // Find and select the agent based on URL parameter
  useEffect(() => {
    if (agentId && agents.length > 0 && agentId !== 'billing') {
      const agent = agents.find(a => a.id === agentId);
      if (agent && (!selectedAgent || selectedAgent.id !== agentId)) {
        selectAgent(agent);
      } else if (!agent) {
        // Agent not found, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [agentId, agents, selectedAgent, selectAgent, navigate]);

  const handleCreateAgent = () => {
    navigate('/create-agent');
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

  const getTrainingStatusColor = (status) => {
    switch (status) {
      case 'trained': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'not_trained': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // If billing page, show pricing dashboard
  if (isBillingPage) {
    return (
      <>
        <Helmet>
          <title>Billing - Orchis</title>
          <meta name="description" content="Manage your billing and subscription" />
        </Helmet>
        
        <div className="min-h-screen bg-stone-100">
          <Navbar />
          <PricingDashboard />
        </div>
      </>
    );
  }

  // If agentId exists in URL, show agent views
  if (agentId) {
    return (
      <>
        <Helmet>
          <title>{selectedAgent?.name || 'Agent'} - Orchis</title>
          <meta name="description" content="Manage your AI agent" />
        </Helmet>
        
        <div className="min-h-screen bg-stone-100">
          <Navbar />
          
          {/* View Content */}
          {showEmbedView ? (
            <EmbedView 
              agent={selectedAgent} 
              onBack={() => setShowEmbedView(false)}
            />
          ) : (
            <AgentDashboard 
              agent={selectedAgent} 
              onShowEmbed={() => setShowEmbedView(true)}
            />
          )}
        </div>
      </>
    );
  }

  // Default dashboard view (grid of agents)
  return (
    <>
      <Helmet>
        <title>AI Agents - Orchis</title>
        <meta name="description" content="Manage and train your AI assistants" />
      </Helmet>
      
      <div className="min-h-screen bg-stone-100">
        <Navbar />
        
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="text-xs text-stone-400 mb-2">Dashboard</div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-thin text-stone-900">AI Agents</h1>
                <div className="w-12 h-px bg-stone-900 mt-4"></div>
              </div>
              <button
                onClick={handleCreateAgent}
                className="px-6 py-2 text-sm font-medium transition-colors rounded-xl text-white flex items-center gap-3 hover:opacity-90 cursor-pointer"
                style={{
                  borderWidth: '0.5px',
                  borderStyle: 'solid',
                  borderColor: 'rgb(20, 20, 20)',
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Create Agent
              </button>
            </div>
          </div>

          {/* Agent Grid */}
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <CpuChipIcon className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-stone-900 mb-2">No agents yet</div>
              <div className="text-stone-500">Create your first AI agent to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-6 border border-stone-200 rounded-xl hover:border-stone-300 cursor-pointer transition-colors bg-stone-50"
                  onClick={() => {
                    selectAgent(agent);
                    navigate(`/dashboard/${agent.id}`);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {agent.logoUrl ? (
                        <img 
                          src={agent.logoUrl} 
                          alt={agent.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <CpuChipIcon className="w-5 h-5 text-stone-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-medium text-stone-900 truncate">{agent.name}</div>
                      <div className="text-sm text-stone-500 truncate mt-1">{agent.description}</div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrainingStatusColor(agent.trainingStatus)}`}>
                          {agent.trainingStatus?.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-stone-400">{agent.documentCount || 0} docs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </>
  );
}