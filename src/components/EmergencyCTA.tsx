import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Heart, Shield } from 'lucide-react';

export const EmergencyCTA: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white relative overflow-hidden">
      {/* Abstract Design Elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#fff_0%,transparent_100%)]" />
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Warning Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold mb-6 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          Urgent Matching System Active
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Need Blood Urgently?
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-rose-100 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
          Create a verified request in seconds. Raktsetu immediately scores matching donors within your geographic perimeter to facilitate rapid response.
        </p>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/register?role=receiver"
            className="w-full sm:w-auto bg-white text-rose-900 text-base font-bold px-7 py-4 rounded-xl shadow-lg hover:bg-rose-50 hover:scale-[1.01] active:scale-100 transition-all duration-200 text-center block"
          >
            Create Emergency Request
          </Link>
          
          <Link
            to="/register?role=donor"
            className="w-full sm:w-auto bg-rose-700/50 text-white text-base font-semibold px-7 py-4 rounded-xl border border-rose-500/40 hover:bg-rose-700/80 hover:border-rose-400 transition-all duration-200 text-center block"
          >
            Become a Donor
          </Link>
        </div>

        {/* Quality assurance footer */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-rose-200 font-semibold opacity-85">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-400" />
            Proximity & Compatibility Matched
          </div>
          <div className="hidden sm:block text-rose-400/50">•</div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-rose-400 fill-current" />
            Zero Commercial Charges
          </div>
        </div>

      </div>
    </section>
  );
};
