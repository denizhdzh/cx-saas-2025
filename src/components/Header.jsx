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
      <div className="max-w-5xl mx-auto px-8 py-6 relative">
        <div className={`flex items-center justify-between transition-all duration-200 ${
          isScrolled 
            ? 'bg-white border border-neutral-300 rounded-3xl px-4 py-3' 
            : 'px-0 py-0'
        }`}>
          {/* Logo */}
          <Link to="/" className="text-lg font-bold text-neutral-900">
            Orchis AI
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              Product
            </a>
            <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              Pricing
            </a>
            <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              About
            </a>
          </nav>
          
          {/* CTA Button */}
          <Link 
            to="/signin"
            className="px-4 py-2 text-xs font-medium transition-colors rounded-xl text-white"
            style={{
              borderWidth: '0.5px',
              borderStyle: 'solid',
              borderColor: 'rgb(20, 20, 20)',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}