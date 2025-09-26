import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
        <div className={`flex items-center justify-between transition-all duration-200 ${
          isScrolled 
            ? 'bg-white border border-neutral-300 rounded-3xl px-3 sm:px-4 py-2 sm:py-3' 
            : 'px-0 py-0'
        }`}>
          {/* Logo */}
          <Link to="/" className="relative inline-block">
            <img src="/logonaked.png" alt="Orchis" className="h-6 sm:h-8 w-auto" />
          </Link>
          
          {/* Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a 
              href="#features" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How it Works
            </a>
            <a 
              href="#pricing" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Pricing
            </a>
          </nav>
          
          {/* Join Waitlist Button */}
          <button 
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-colors rounded-xl text-white"
            style={{
              borderWidth: '0.5px',
              borderStyle: 'solid',
              borderColor: 'rgb(20, 20, 20)',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
            }}
            onClick={() => {
              document.querySelector('input[type="email"]')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
              });
              setTimeout(() => {
                document.querySelector('input[type="email"]')?.focus();
              }, 500);
            }}
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </header>
  );
}