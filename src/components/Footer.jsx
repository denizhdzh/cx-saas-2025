import React from 'react';

export default function Footer() {
  return (
    <footer className="relative border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-8 py-12 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company */}
            <div className="md:col-span-2">
              <div className="text-base font-bold text-neutral-900 mb-4">
                ORCHIS AI
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-md">
                AI agents that actually understand context, learn from your business, 
                and speak like humans do. Coming soon.
              </p>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Get in Touch</h3>
              <p className="text-xs text-neutral-600 mb-3">
                Questions about ORCHIS?
              </p>
              <a href="mailto:hello@orchis.ai" className="text-xs text-neutral-900 hover:underline">
                hello@orchis.ai
              </a>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Coming Soon</h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-xs text-neutral-600">Documentation</span>
                </li>
                <li>
                  <span className="text-xs text-neutral-600">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-xs text-neutral-600">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-neutral-600">
                © 2025 ORCHIS AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}