import React from 'react';
import { ArrowDown, XCircle, CheckCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export const WhyRaktsetu: React.FC = () => {
  const traditionalSteps = [
    'Search Directory',
    'List of Unverified Donors',
    'Dozens of Manual Calls',
    'Frustrated Waiting & Hope'
  ];

  const raktsetuSteps = [
    'Create Blood Request',
    'Intelligent Proximity Matching',
    'Prioritized Notifications',
    'Automatic Backup Escalation',
    'Successful Coordination'
  ];

  return (
    <section id="why-raktsetu" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            More Than a Donor Directory
          </h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Traditional donor platforms mainly help users search for blood donors. Raktsetu focuses on <strong>intelligent coordination</strong> — prioritizing suitable donors, managing responses, activating backups, and building reliable donor networks.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-12">
          
          {/* Column 1: Traditional (Left) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-slate-400" />
                  Traditional Search
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                  <XCircle className="h-3 w-3" /> Manual Flow
                </span>
              </div>
              
              <div className="space-y-4">
                {traditionalSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                      <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-600">{step}</p>
                    </div>
                    {idx < traditionalSteps.length - 1 && (
                      <div className="flex justify-center text-slate-300">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 bg-rose-50/30 p-3 rounded-2xl">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                Relies on manual outreach, outdated phone numbers, and slow response times during emergencies.
              </p>
            </div>
          </div>

          {/* Column 2: VS Divider (Center) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-4 lg:py-0">
            <div className="h-10 w-10 rounded-full bg-slate-200 border-4 border-slate-50 flex items-center justify-center font-bold text-slate-500 text-sm">
              VS
            </div>
          </div>

          {/* Column 3: Raktsetu (Right) */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-rose-500" />
                  Raktsetu Smart Engine
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="h-3 w-3" /> AI-Driven
                </span>
              </div>
              
              <div className="space-y-4">
                {raktsetuSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-800">
                      <span className="h-6 w-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-200">{step}</p>
                    </div>
                    {idx < raktsetuSteps.length - 1 && (
                      <div className="flex justify-center text-rose-500">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400 font-semibold leading-relaxed">
                Matches compatibility, location, and scheduling dynamically. Triggers backup notifications automatically.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
