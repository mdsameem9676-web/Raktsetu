import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Search, Activity, Users, ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-white to-white pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

      {/* Floating Blobs */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 -z-10 h-96 w-96 rounded-full bg-blue-100/30 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text Section */}
          <div className="lg:col-span-6 text-center lg:text-left">
            {/* Trusted Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold mb-6">
              <ShieldCheck className="h-4 w-4 text-rose-600" />
              AI-Powered Healthcare Coordination
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Find the Right Donor, <br className="hidden sm:inline" />
              <span className="text-rose-600 relative">
                At the Right Time.
                <span className="absolute bottom-1 left-0 w-full h-2 bg-rose-100 -z-10 rounded" />
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Raktsetu intelligently connects verified blood requests with suitable nearby donors, helping communities respond faster when every minute matters.
            </p>
            
            {/* Call To Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register?role=receiver"
                className="inline-flex items-center justify-center bg-rose-600 text-white text-base font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-300 transition-all duration-200"
              >
                Find a Donor
              </Link>
              <Link
                to="/register?role=donor"
                className="inline-flex items-center justify-center bg-white text-slate-800 text-base font-semibold px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                Become a Donor
              </Link>
            </div>

            {/* Quick Platform Capabilities (MVP) */}
            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">8</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Blood Groups Checked</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">Two-Way</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Donor + Receiver</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">Live</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Journey Tracking</p>
              </div>
            </div>
          </div>

          {/* Interactive Visualization Section */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[480px]">
              
              {/* Main Card */}
              <div className="relative bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden border border-slate-800/80">
                {/* Tech Dashboard Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Live Matching Engine
                    </span>
                  </div>
                  <span className="text-xs font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Priority Request
                  </span>
                </div>

                {/* SVG Matching Flow */}
                <div className="relative h-60 flex items-center justify-between px-2 sm:px-6">
                  {/* Left: Donor Node */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-500 shadow-lg relative group">
                      <Users className="h-6 w-6" />
                      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900">
                        O-
                      </span>
                    </div>
                    <span className="mt-2 text-xs font-semibold text-slate-300">Donor</span>
                    <span className="text-[10px] text-slate-500">Sameer K. (1.8km)</span>
                  </div>

                  {/* Center Node (AI MATCHING) */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-16 h-16 rounded-full bg-rose-600/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 relative">
                      <div className="absolute inset-0.5 rounded-full border border-rose-500/40 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-500/50 animate-[spin_10s_linear_infinite]" />
                      <Activity className="h-6 w-6 text-rose-500 animate-[pulse_2s_infinite]" />
                    </div>
                    <span className="mt-2.5 text-xs font-bold text-rose-500 uppercase tracking-widest text-[9px]">
                      AI Matcher
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">99.8% Match Score</span>
                  </div>

                  {/* Right: Hospital/Patient Node */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-500 shadow-lg relative">
                      <MapPin className="h-6 w-6" />
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900">
                        O-
                      </span>
                    </div>
                    <span className="mt-2 text-xs font-semibold text-slate-300">ICU Ward</span>
                    <span className="text-[10px] text-slate-500">City General Hosp.</span>
                  </div>

                  {/* Flowing SVG Connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background path line */}
                    <path d="M 50,120 Q 120,60 215,120 T 380,120" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                    
                    {/* Animated Match connection */}
                    <path 
                      d="M 50,120 Q 120,60 215,120 T 380,120" 
                      fill="none" 
                      stroke="url(#gradient-flow)" 
                      strokeWidth="2.5" 
                      strokeDasharray="10 150" 
                      strokeDashoffset="0"
                      className="animate-[dash_3s_linear_infinite]" 
                    />
                    
                    <defs>
                      <linearGradient id="gradient-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Micro Cards overlay */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 flex items-start gap-2.5">
                    <Search className="h-4.5 w-4.5 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-300">Scanning Donors</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Filter by proximity & availability</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 flex items-start gap-2.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-300">Compatibility Checked</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Strict RBC rule validation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Overlay Pill */}
              <div className="absolute -bottom-5 -right-3 sm:-right-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex items-center gap-3 animate-[bounce_4s_infinite_2s]">
                <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Donor Matched</p>
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                    Matching complete <ArrowRight className="h-3 w-3 text-rose-500" />
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* Custom CSS Animation for the SVG Path flow */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -160;
          }
        }
      `}</style>
    </section>
  );
};
