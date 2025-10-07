import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export default function UpgradeModal({ isOpen, onClose, currentPlan, agentLimit, currentAgentCount }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/dashboard/billing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Agent Limit Reached
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
              You've reached the maximum number of agents for your current plan.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Current Plan:</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-50 capitalize">
                {currentPlan || 'Free'}
              </span>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-orange-800 dark:text-orange-400">Agents Created</span>
              <span className="text-sm font-bold text-orange-900 dark:text-orange-300">
                {currentAgentCount} / {agentLimit === -1 ? '∞' : agentLimit}
              </span>
            </div>
            <div className="w-full bg-orange-200 dark:bg-orange-900/40 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: agentLimit === -1 ? '100%' : `${Math.min((currentAgentCount / agentLimit) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Upgrade your plan to create more agents:
            </p>
            <div className="space-y-2">
              {currentPlan === 'free' && (
                <>
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span><strong>Starter Plan:</strong> Create up to 1 agent</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span><strong>Growth Plan:</strong> Create up to 3 agents</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span><strong>Scale Plan:</strong> Unlimited agents</span>
                  </div>
                </>
              )}
              {currentPlan === 'starter' && (
                <>
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span><strong>Growth Plan:</strong> Create up to 3 agents</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span><strong>Scale Plan:</strong> Unlimited agents</span>
                  </div>
                </>
              )}
              {currentPlan === 'growth' && (
                <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span><strong>Scale Plan:</strong> Unlimited agents</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RocketLaunchIcon className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}
