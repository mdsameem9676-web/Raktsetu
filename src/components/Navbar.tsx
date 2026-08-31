import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Heart } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Features', href: '/#features' },
    { name: 'About', href: '/#why-raktsetu' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-rose-600 p-2 rounded-xl text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
              Raktsetu
              <span className="ml-1 text-[10px] uppercase font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors px-3 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-rose-600 text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-sm hover:bg-rose-700 hover:shadow transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg py-4 px-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-slate-600 hover:text-rose-600 py-1 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <hr className="border-slate-100" />
          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-base font-semibold text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 block"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-base font-semibold text-white bg-rose-600 py-2.5 rounded-xl shadow-sm hover:bg-rose-700 transition-all block"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
