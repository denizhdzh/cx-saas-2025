import React from 'react';

export default function ToastDemo() {
  return (
    <div className="bg-black rounded-xl shadow-2xl border border-neutral-800 p-6 w-80">
      {/* Top row: Logo and Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="border border-neutral-600 rounded p-1">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-6 h-6"
          />
        </div>
        <div className="text-white text-sm font-medium">
          New Feature
        </div>
      </div>
      
      {/* Subtitle */}
      <div className="text-neutral-400 text-xs mb-3 ml-10">
        AI-powered analytics ready
      </div>
      
      {/* Button */}
      <button 
        className="w-full px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white"
        style={{
          borderWidth: '0.5px',
          borderStyle: 'solid',
          borderColor: 'rgb(20, 20, 20)',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
        }}
      >
        View Dashboard
      </button>
      
      {/* Ambient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-20 blur-xl -z-10"></div>
    </div>
  );
}