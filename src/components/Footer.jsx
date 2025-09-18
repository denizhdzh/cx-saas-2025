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
            <div>
              <div className="text-base font-bold text-neutral-900 mb-4">
                Candela AI
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Building the future of digital experiences, one product at a time.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-neutral-600">
                © 2025 Brand. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                  Terms
                </a>
                <a href="#" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}