import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import AgentDashboard from '../components/AgentDashboard';
import EmbedView from '../components/EmbedView';
import CreateAgentView from '../components/CreateAgentView';
import PricingDashboard from '../components/PricingDashboard';
import SettingsView from '../components/SettingsView';
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
  const { agents, selectAgent, selectedAgent, loading } = useAgent();
  const [showEmbedView, setShowEmbedView] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [initialSection, setInitialSection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    // If on main dashboard page and agents exist, redirect to first agent
    if (!agentId && agents.length > 0) {
      const firstAgent = agents[0];
      console.log('🔀 No agentId but agents exist, redirecting to first agent:', firstAgent.id);
      selectAgent(firstAgent);
      navigate(`/dashboard/${firstAgent.id}`, { replace: true });
      return;
    }

    if (agentId && agents.length > 0) {
      const agent = agents.find(a => a.id === agentId);
      if (agent && (!selectedAgent || selectedAgent.id !== agentId)) {
        console.log('✅ Selecting agent:', agent.id);
        selectAgent(agent);
      } else if (!agent) {
        // Agent not found, redirect to first agent
        console.log('❌ Agent not found, navigating to first agent');
        const firstAgent = agents[0];
        selectAgent(firstAgent);
        navigate(`/dashboard/${firstAgent.id}`, { replace: true });
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

  // Show loading spinner while agents are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="lg:ml-64 flex items-center justify-center h-screen">
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

        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-30 flex items-center px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <svg className="w-6 h-6 text-neutral-900 dark:text-neutral-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-3 font-bold text-neutral-900 dark:text-neutral-50">Billing</span>
          </div>

          <div className="lg:ml-64 pt-16 lg:pt-0">
            <PricingDashboard />
          </div>
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

        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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

        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-30 flex items-center px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <svg className="w-6 h-6 text-neutral-900 dark:text-neutral-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-3 font-bold text-neutral-900 dark:text-neutral-50">Settings</span>
          </div>

          <div className="lg:ml-64 pt-16 lg:pt-0">
            <SettingsView onBack={() => navigate('/dashboard')} />
          </div>
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

        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-30 flex items-center px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <svg className="w-6 h-6 text-neutral-900 dark:text-neutral-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-3 font-bold text-neutral-900 dark:text-neutral-50">{selectedAgent?.projectName || selectedAgent?.name || 'Dashboard'}</span>
          </div>

          <div className="lg:ml-64 pt-16 lg:pt-0">
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
              />
            )}
          </div>
        </div>
      </>
    );
  }

  // Default: Loading state (should redirect to first agent if agents exist)
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-neutral-500">Loading...</div>
        </div>
      </div>
    </div>
  );
}