import React from 'react';
import { X, Heart, ShieldAlert } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, actionName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Content Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-800">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
            <Heart className="h-6 w-6 animate-pulse" />
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Raktsetu Portal Preview
          </h3>
          
          {actionName && (
            <span className="inline-block px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-full mb-3">
              Action: {actionName}
            </span>
          )}

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Thank you for exploring Raktsetu! The portal features—including secure authentication, donor registration dashboards, patient requests, and AI-powered proximity matching—will be fully functional in the next phase of development.
          </p>

          <div className="flex w-full flex-col gap-2">
            <button
              onClick={onClose}
              className="w-full justify-center rounded-xl bg-rose-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:bg-rose-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              Continue Exploring
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldAlert className="h-3.5 w-3.5" />
              Demo mode • No actual backend connects at this stage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
