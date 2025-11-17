import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'product' or 'resources'
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle dropdown hover with delay
  const handleDropdownEnter = (dropdown) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 1000); // 1 second delay
  };

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

  const handleNavClick = (id) => {
    setOpenDropdown(null); // Close dropdown
    if (window.location.pathname !== '/') {
      window.location.href = `/#${id}`;
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side: Logo + Dropdown Menus */}
          <div className={`flex items-center gap-3 transition-all duration-200 ${
            isScrolled ? 'bg-stone-950/60 backdrop-blur-md rounded-xl p-4 pr-6' : ''
          }`} ref={dropdownRef}>
            {/* Logo */}
            <Link to="/" className="relative inline-block">
              <img src="/logonaked.webp" alt="Orchis" className="h-6 sm:h-8 w-auto" />
            </Link>

            {/* Dropdown Menus - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {/* Product Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('product')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="text-sm font-medium text-stone-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  Product
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'product' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Product Dropdown Menu */}
                <div className={`absolute top-full left-0 mt-2 w-72 bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 transition-all duration-200 origin-top ${
                  openDropdown === 'product'
                    ? 'opacity-100 scale-y-100 pointer-events-auto'
                    : 'opacity-0 scale-y-95 pointer-events-none'
                }`}>
                  <div className="p-3 space-y-1">
                    <Link
                      to="/ai-agent"
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors rounded-lg"
                    >
                      <div className="font-medium">AI Agent</div>
                      <div className="text-xs text-stone-500 mt-0.5">Intelligent conversations</div>
                    </Link>
                    <Link
                      to="/session-intelligence"
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors rounded-lg"
                    >
                      <div className="font-medium">Session Intelligence</div>
                      <div className="text-xs text-stone-500 mt-0.5">Visitor tracking & insights</div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('resources')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="text-sm font-medium text-stone-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  Resources
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'resources' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Resources Dropdown Menu */}
                <div className={`absolute top-full left-0 mt-2 w-72 bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 transition-all duration-200 origin-top ${
                  openDropdown === 'resources'
                    ? 'opacity-100 scale-y-100 pointer-events-auto'
                    : 'opacity-0 scale-y-95 pointer-events-none'
                }`}>
                  <div className="p-3 space-y-1">
                    <Link
                      to="/roadmap"
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors rounded-lg"
                    >
                      <div className="font-medium">Roadmap</div>
                      <div className="text-xs text-stone-500 mt-0.5">What's coming next</div>
                    </Link>
                    <Link
                      to="/blog"
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors rounded-lg"
                    >
                      <div className="font-medium">Blog</div>
                      <div className="text-xs text-stone-500 mt-0.5">News & updates</div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Pricing + Sign Up/Dashboard */}
          <div className={`hidden md:flex items-center gap-3 transition-all duration-200 ${
            isScrolled ? 'bg-stone-950/60 backdrop-blur-md rounded-xl p-4 pl-6' : ''
          }`}>
            {/* Pricing Link */}
            <button
              onClick={() => handleNavClick('pricing')}
              className="text-sm font-medium text-stone-400 hover:text-white transition-colors"
            >
              Pricing
            </button>

            {/* Sign Up / Dashboard Button */}
            <button
              className="btn-landing"
              onClick={() => navigate(user ? '/dashboard' : '/signin')}
            >
              {user ? 'Dashboard' : 'Sign Up'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden btn-landing"
            onClick={() => navigate(user ? '/dashboard' : '/signin')}
          >
            {user ? 'Dashboard' : 'Sign Up'}
          </button>
        </div>
      </div>
    </header>
  );
}