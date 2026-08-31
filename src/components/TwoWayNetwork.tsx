import React from 'react';
import { Heart, Users2, ArrowRight, RefreshCw, Sparkles, Activity } from 'lucide-react';

export const TwoWayNetwork: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50 relative border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-rose-50 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-indigo-50 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left: Text Explanation */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
                <RefreshCw className="h-3.5 w-3.5" />
                Two-Way Blood Network
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Anyone can be both a <span className="text-rose-600">donor</span> and a <span className="text-indigo-600">receiver</span>.
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                A healthy receiver can register as a donor and help others. If a donor later needs blood because of an emergency, illness, or accident, they can switch to receiver mode and request blood.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <Sparkles className="h-4 w-4 text-rose-600" />
                  Unified Single Account
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Instant Mode Switching
                </div>
              </div>
            </div>

            {/* Right: Visual Flow Diagram */}
            <div className="lg:col-span-6">
              <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
                  Continuous Lifeline Cycle
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Step 1 */}
                  <div className="w-full sm:w-1/3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2 border border-rose-100">
                      <Heart className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Healthy User</p>
                    <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Donor Mode</p>
                  </div>

                  {/* Arrow 1 */}
                  <div className="text-slate-300 rotate-90 sm:rotate-0">
                    <ArrowRight className="h-5 w-5" />
                  </div>

                  {/* Step 2 */}
                  <div className="w-full sm:w-1/3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
                      <Users2 className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Emergency Need</p>
                    <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Receiver Mode</p>
                  </div>

                  {/* Arrow 2 */}
                  <div className="text-slate-300 rotate-90 sm:rotate-0">
                    <ArrowRight className="h-5 w-5" />
                  </div>

                  {/* Step 3 */}
                  <div className="w-full sm:w-1/3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                      <Heart className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Recovered</p>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Donor Mode</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200/60 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-slate-500 font-medium">
                    🔄 Seamlessly transition between giving and receiving blood without separate logins.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
