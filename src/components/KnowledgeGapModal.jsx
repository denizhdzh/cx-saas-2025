import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function KnowledgeGapModal({ gap, isOpen, onClose, onSubmit, onSkip }) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !gap) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(gap, answer);
      setAnswer('');
      onClose();
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Fill Knowledge Gap
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Question */}
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
              Question ({gap.count}x asked)
            </label>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
              {gap.category && (
                <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800 mb-2">
                  {gap.category}
                </span>
              )}
              <p className="text-sm text-neutral-900 dark:text-neutral-50 font-medium">
                {gap.representativeQuestion || gap.question || 'Unknown question'}
              </p>
              {gap.recentQuestions && gap.recentQuestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Recent variations:</p>
                  <ul className="space-y-1">
                    {gap.recentQuestions.slice(0, 3).map((q, idx) => (
                      <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-400">
                        • {q.question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Answer Input */}
          <div>
            <label htmlFor="answer" className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a clear and comprehensive answer to this question..."
              rows={8}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              💡 The AI will enhance your answer and add it to the agent's knowledge base
            </p>
          </div>

          {/* Info */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-800 dark:text-green-400">
              <strong>What happens next:</strong>
              <br />
              1. AI will enhance and format your answer professionally
              <br />
              2. The enhanced answer will be added to your agent's knowledge base as a new chunk
              <br />
              3. Your agent will be able to answer this question in future conversations
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          {onSkip && (
            <button
              type="button"
              onClick={() => {
                onSkip(gap);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Skip this gap
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Add to Knowledge Base
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
