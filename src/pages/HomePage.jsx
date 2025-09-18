import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Landing Page</title>
        <meta name="description" content="Modern landing page built with React and Tailwind CSS" />
      </Helmet>
      <div className="min-h-screen bg-stone-900 text-stone-200">
        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">
              Welcome to Your Landing Page
            </h1>
            <p className="text-stone-400 text-xl max-w-2xl mx-auto">
              This is a clean slate for building your new landing page with React and Tailwind CSS.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}