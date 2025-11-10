import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Orchis Chatbot
  useEffect(() => {
    // Check if script already exists in the DOM
    const existingScript = document.querySelector('script[src="https://orchis.app/chatbot-widget.js"]');

    if (!existingScript && !window.OrchisChatbot) {
      const script = document.createElement('script');
      script.src = 'https://orchis.app/chatbot-widget.js';
      script.onload = function() {
        if (window.OrchisChatbot) {
          window.OrchisChatbot.init({
            agentId: 'YUtxUdsTvLauRmozIgKT'
          });
        }
      };
      document.head.appendChild(script);
    } else if (window.OrchisChatbot && !window.OrchisChatbot.isInitialized) {
      // If script loaded but not initialized
      window.OrchisChatbot.init({
        agentId: 'YUtxUdsTvLauRmozIgKT'
      });
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
        <div className={`flex items-center justify-between transition-all duration-200 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xs border border-neutral-300 rounded-3xl px-3 sm:px-4 py-2 sm:py-3' 
            : 'px-0 py-0'
        }`}>
          {/* Logo */}
          <Link to="/" className="relative inline-block">
            <img src="/logo.webp" alt="Orchis" className="h-6 sm:h-8 w-auto" />
          </Link>
          
          {/* Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a
              href="/#features"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname !== '/') {
                  window.location.href = '/#features';
                } else {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Features
            </a>
            <a
              href="/#session-intelligence"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname !== '/') {
                  window.location.href = '/#session-intelligence';
                } else {
                  document.getElementById('session-intelligence')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Intelligence
            </a>
            <a
              href="/#before-after"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname !== '/') {
                  window.location.href = '/#before-after';
                } else {
                  document.getElementById('before-after')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Impact
            </a>
            <a
              href="/#pricing"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname !== '/') {
                  window.location.href = '/#pricing';
                } else {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Pricing
            </a>
            <Link
              to="/roadmap"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Roadmap
            </Link>
            <Link
              to="/blog"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Blog
            </Link>
          </nav>
          
          {/* Sign Up / Dashboard Button */}
          <button
            className="btn-landing"
            onClick={() => navigate(user ? '/dashboard' : '/signin')}
          >
            {user ? 'Dashboard' : 'Sign Up'}
          </button>
        </div>
      </div>
    </header>
  );
}