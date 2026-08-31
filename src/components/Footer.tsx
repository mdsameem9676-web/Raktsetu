import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleUnsupported = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('This link is currently inactive in the step 2 prototype.');
  };

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 md:py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-slate-800">
          
          {/* Logo & Tagline */}
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <div className="bg-rose-600 p-2 rounded-xl text-white shadow-md">
                <Heart className="h-4.5 w-4.5 fill-current" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Raktsetu
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
              Connecting verified blood requirements with suitable nearby donors using intelligent matching and automated coordination.
            </p>
            <span className="text-xs text-rose-500 font-semibold uppercase tracking-wider block">
              "Connecting people when every minute matters."
            </span>
          </div>

          {/* Quick Links Column 1 */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <a href="/#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="/#why-raktsetu" className="hover:text-white transition-colors">About Us</a>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2 */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">
              Legal & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a 
                  href="#" 
                  onClick={handleUnsupported}
                  className="hover:text-white transition-colors"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={handleUnsupported}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={handleUnsupported}
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Coordination Disclaimer */}
        <div className="py-6 border-b border-slate-800/80">
          <p className="text-xs text-slate-400/90 leading-relaxed text-center sm:text-left bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <strong>Disclaimer:</strong> Raktsetu connects donors and receivers based on compatibility, availability and proximity. Hospital or blood-bank coordination depends on the information provided by users.
          </p>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {currentYear} Raktsetu. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">
            Engineered for humanitarian and emergency blood coordination support.
          </p>
        </div>

      </div>
    </footer>
  );
};
