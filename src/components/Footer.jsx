import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-800/50 border-t border-stone-700/60 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-stone-200 mb-3">tool<span className="text-lime-400">/</span></h3>
            <p className="text-sm">
              The ultimate directory for discovering tools to boost your productivity and creativity.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-stone-300 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-lime-400 transition-colors text-sm">Home</Link></li>
              <li><Link to="/browse" className="hover:text-lime-400 transition-colors text-sm">Browse All</Link></li>
              <li><Link to="/submit-tool" className="hover:text-lime-400 transition-colors text-sm">Submit a Tool</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-stone-300 mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-lime-400 transition-colors text-sm">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-lime-400 transition-colors text-sm">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-lime-400 transition-colors text-sm">Privacy Policy</Link></li>
              {/* <li><Link to="/terms-of-service" className="hover:text-lime-400 transition-colors text-sm">Terms of Service</Link></li> */}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-stone-700/60 pt-8 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} tool/. All rights reserved. Built with love 🫶🏻</p>
        </div>
      </div>
    </footer>
  );
} 