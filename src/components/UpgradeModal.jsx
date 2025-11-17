import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { MachineRobotIcon, Cancel01Icon, ZapIcon } from '@hugeicons/core-free-icons';

export default function UpgradeModal({ isOpen, onClose, currentPlan, agentLimit, currentAgentCount }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/dashboard/billing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={MachineRobotIcon} className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Agent Limit Reached
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            You've reached the agent limit for your <strong className="text-neutral-900 dark:text-neutral-50 capitalize">{currentPlan || 'Free'}</strong> plan ({currentAgentCount}/{agentLimit === -1 ? '∞' : agentLimit}). Upgrade to create more agents.
          </p>

          <div className="space-y-2">
            {currentPlan === 'free' && (
              <>
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span><strong>Starter:</strong> 1 agent</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span><strong>Growth:</strong> 5 agents</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span><strong>Scale:</strong> Unlimited agents</span>
                </div>
              </>
            )}
            {currentPlan === 'starter' && (
              <>
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span><strong>Growth:</strong> 5 agents</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span><strong>Scale:</strong> Unlimited agents</span>
                </div>
              </>
            )}
            {currentPlan === 'growth' && (
              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span><strong>Scale:</strong> Unlimited agents</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <HugeiconsIcon icon={ZapIcon} className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}
