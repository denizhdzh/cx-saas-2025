import React from 'react';
import Navbar from '../components/Navbar';
import ConversationHistory from '../components/ConversationHistory';

export default function ConversationHistoryPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Navbar />
      <ConversationHistory />
    </div>
  );
}
