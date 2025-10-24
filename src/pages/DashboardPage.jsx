import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PlusIcon, CpuChipIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import AgentDashboard from '../components/AgentDashboard';
import EmbedView from '../components/EmbedView';
import CreateAgentView from '../components/CreateAgentView';
import PricingDashboard from '../components/PricingDashboard';
import SettingsView from '../components/SettingsView';
import UpgradeModal from '../components/UpgradeModal';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isBillingPage = agentId === 'billing';
  const isCreatePage = agentId === 'create';
  const isSettingsPage = agentId === 'settings';
  const { agents, deleteAgent, selectAgent, selectedAgent, loading } = useAgent();
  const [showEmbedView, setShowEmbedView] = useState(false);
  const [showCreateView, setShowCreateView] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [initialSection, setInitialSection] = useState(null);

  // Find and select the agent based on URL parameter
  useEffect(() => {
    console.log('🔍 DashboardPage useEffect triggered:', {
      agentId,
      agentsCount: agents.length,
      currentPath: window.location.pathname,
      isCreatePage,
      isBillingPage,
      isSettingsPage
    });

    // Skip this effect entirely if we're on create, billing, or settings pages
    if (agentId === 'create' || agentId === 'billing' || agentId === 'settings') {
      console.log('⏭️ Skipping effect for special page:', agentId);
      return;
    }

    // Don't do anything if we're on the main dashboard page (no agentId)
    if (!agentId) {
      console.log('⏭️ No agentId, staying on main dashboard');
      return;
    }

    if (agentId && agents.length > 0) {
      const agent = agents.find(a => a.id === agentId);
      if (agent && (!selectedAgent || selectedAgent.id !== agentId)) {
        console.log('✅ Selecting agent:', agent.id);
        selectAgent(agent);
      } else if (!agent) {
        // Agent not found, redirect to dashboard
        console.log('❌ Agent not found, navigating to /dashboard');
        navigate('/dashboard');
      }
    }
  }, [agentId, agents, selectedAgent, selectAgent, navigate]);

  // Check for query params to show embed view
  useEffect(() => {
    const view = searchParams.get('view');
    const section = searchParams.get('section');

    if (view === 'agentsettings') {
      setShowEmbedView(true);
      if (section) {
        setInitialSection(section);
      }
    } else {
      setShowEmbedView(false);
      setInitialSection(null);
    }
  }, [searchParams]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSubscriptionData({
            plan: userData.subscriptionPlan || 'free',
            agentLimit: userData.agentLimit || 0,
            status: userData.subscriptionStatus || 'free'
          });
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const handleCreateAgent = () => {
    console.log('🎯 handleCreateAgent called - navigating to /dashboard/create');
    // Check if user has reached their agent limit
    if (subscriptionData) {
      const { agentLimit } = subscriptionData;
      if (agentLimit !== -1 && agents.length >= agentLimit) {
        console.log('⛔ Agent limit reached, showing upgrade modal');
        setShowUpgradeModal(true);
        return;
      }
    }
    console.log('✅ Navigating to /dashboard/create');
    navigate('/dashboard/create');
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

  // Show loading spinner while agents are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Force onboarding: if no agents exist AND not on special pages, redirect to create page with proper URL
  if (agents.length === 0 && !isBillingPage && !isCreatePage && !isSettingsPage && !loading) {
    console.log('🆕 No agents found, redirecting to /dashboard/create');
    navigate('/dashboard/create', { replace: true });
    return null;
  }

  // If billing page, show pricing dashboard
  if (isBillingPage) {
    return (
      <>
        <Helmet>
          <title>Billing - Orchis</title>
          <meta name="description" content="Manage your billing and subscription" />
        </Helmet>

        <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
          <Navbar />
          <PricingDashboard />
        </div>
      </>
    );
  }

  // If create page, show create agent view (with limit check)
  if (isCreatePage) {
    // Check if user has reached their agent limit before showing create view
    // Only check if subscriptionData is loaded and user has at least 1 agent
    // (If agents.length is 0, this is their first agent - always allow access to create page)
    const shouldCheckLimit = subscriptionData && agents.length > 0;
    const isAtLimit = shouldCheckLimit && subscriptionData.agentLimit !== -1 && agents.length >= subscriptionData.agentLimit;

    if (isAtLimit) {
      console.log('⛔ Agent limit reached on create page, redirecting to dashboard');
      // Redirect to dashboard and show upgrade modal
      setTimeout(() => {
        navigate('/dashboard');
        setShowUpgradeModal(true);
      }, 0);
      return null;
    }

    return (
      <>
        <Helmet>
          <title>Create Agent - Orchis</title>
          <meta name="description" content="Create a new AI agent" />
        </Helmet>

        <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
          <Navbar />
          <CreateAgentView onBack={() => navigate('/dashboard')} />
        </div>
      </>
    );
  }

  // If settings page, show settings view
  if (isSettingsPage) {
    return (
      <>
        <Helmet>
          <title>Settings - Orchis</title>
          <meta name="description" content="Manage your account settings" />
        </Helmet>

        <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
          <Navbar />
          <SettingsView onBack={() => navigate('/dashboard')} />
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

        <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
          <Navbar />

          {/* View Content */}
          {showEmbedView ? (
            <EmbedView
              key={selectedAgent?.id}
              agent={selectedAgent}
              onBack={() => {
                setShowEmbedView(false);
                setInitialSection(null);
              }}
              initialSection={initialSection}
            />
          ) : (
            <AgentDashboard
              key={selectedAgent?.id}
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
      
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        <Navbar />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={subscriptionData?.plan}
          agentLimit={subscriptionData?.agentLimit}
          currentAgentCount={agents.length}
        />

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="text-xs text-stone-400 mb-2">Dashboard</div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-thin text-stone-900 dark:text-stone-50">AI Agents</h1>
                <div className="w-12 h-px bg-stone-900 dark:bg-stone-50 mt-4"></div>
              </div>
              <button
                onClick={handleCreateAgent}
                className={`flex items-center gap-3 ${
                  subscriptionData && subscriptionData.agentLimit !== -1 && agents.length >= subscriptionData.agentLimit
                    ? 'btn-secondary'
                    : 'btn-primary'
                }`}
              >
                {subscriptionData && subscriptionData.agentLimit !== -1 && agents.length >= subscriptionData.agentLimit ? (
                  <>
                    <RocketLaunchIcon className="w-4 h-4" />
                    Upgrade to Create
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Create Agent
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agent Grid */}
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <CpuChipIcon className="w-12 h-12 text-stone-400 dark:text-stone-50 mx-auto mb-4" />
              <div className="text-lg font-medium text-stone-900 dark:text-stone-50 mb-2">No agents yet</div>
              <div className="text-stone-500">Create your first AI agent to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-6 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-stone-300 cursor-pointer transition-colors bg-white dark:bg-stone-800/50"
                  onClick={() => {
                    selectAgent(agent);
                    navigate(`/dashboard/${agent.id}`);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-stone-100 dark:bg-stone-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                      <div className="text-lg font-medium text-stone-900 dark:text-stone-50 truncate">{agent.projectName || agent.name}</div>
                      <div className="text-sm text-stone-500 truncate mt-1">{agent.websiteUrl}</div>
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