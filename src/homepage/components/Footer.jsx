import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-8 py-12 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-800"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-800"></div>
        
        <div className="mx-6">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Company */}
            <div className="md:col-span-2">
              <div className="text-base font-bold text-neutral-100 mb-4">
                ORCHIS AI
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                AI agents that actually understand context, learn from your business, 
                and speak like humans do. Coming soon.
              </p>
            </div>
            
            {/* Blog */}
            <div>
              <h3 className="text-sm font-medium text-neutral-100 mb-4">Blog</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/blog" className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors">
                    All Articles
                  </Link>
                </li>
                <li>
                  <Link to="/blog/category/comparisons" className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors">
                    Comparisons
                  </Link>
                </li>
                <li>
                  <Link to="/blog/category/insights" className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors">
                    Insights
                  </Link>
                </li>
                <li>
                  <Link to="/blog/category/guides" className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-sm font-medium text-neutral-100 mb-4">Get in Touch</h3>
              <p className="text-xs text-neutral-400 mb-3">
                Questions about ORCHIS?
              </p>
              <a href="mailto:deniz@orchis.ai" className="text-xs text-neutral-100 hover:underline">
                deniz@orchis.ai
              </a>
            </div>
            
{/* Legal */}
            <div>
              <h3 className="text-sm font-medium text-neutral-100 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="/privacy" 
                    className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="/terms" 
                    className="text-xs text-neutral-400 hover:text-neutral-100 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-neutral-400">
                © 2025 ORCHIS AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}