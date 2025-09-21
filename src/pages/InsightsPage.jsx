import React from 'react';
import Sidebar from '../components/Sidebar';

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      
      <div className="ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-extralight text-neutral-900 mb-4">Insights</h1>
          <p className="text-neutral-600 text-lg">Coming soon</p>
        </div>
      </div>
    </div>
  );
}