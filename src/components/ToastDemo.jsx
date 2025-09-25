import React from 'react';

export default function ToastDemo() {
  return (
    <div className="bg-black rounded-xl shadow-2xl border border-neutral-800 p-6 w-120">
      {/* Top row: Logo and Feature Update */}
      <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        
        <div className="text-white text-sm font-medium">
          Feature Update
        </div>
        <div className="ml-auto w-2 h-2 bg-green-400 rounded-full"></div>
      </div>
      
      {/* Feature update message */}
      <div className="text-neutral-300 text-sm mb-4 leading-relaxed">
      Smart Auto-replies now available! Your AI can automatically suggest responses based on conversation context.
      </div>
      
      {/* AI Input Section */}
      <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
        <div className="text-xs text-neutral-400 mb-2 font-medium">Orchis AI</div>
        <div className="relative">
          <input
            type="text"
            placeholder="Ask anything about Orchis..."
            className="w-full px-3 py-2 pr-10 text-xs bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-600 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent"
          />
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center justify-center transition-colors"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Ambient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-20 blur-xl -z-10"></div>
    </div>
  );
}