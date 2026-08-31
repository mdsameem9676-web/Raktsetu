import React from 'react';
import { ShieldCheck, MapPin, Lock, HeartHandshake } from 'lucide-react';

export const TrustSafety: React.FC = () => {
  const trustCards = [
    {
      title: 'Blood Compatibility Checked',
      description: 'Blood-group compatibility is checked before showing suitable matches.',
      icon: ShieldCheck,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Location-Based Matching',
      description: 'Prioritize nearby compatible donors and requests to reduce response time.',
      icon: MapPin,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Privacy Protected',
      description: 'Only necessary information is shared during the coordination process.',
      icon: Lock,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Safe Donation',
      description: 'Donor eligibility is self-declared and should be medically confirmed before donation.',
      icon: HeartHandshake,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <section id="trust-safety" className="py-20 bg-white relative border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Safety & Trust First
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Trust, Privacy & Safety
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            Every layer of Raktsetu is engineered to protect users, verify RBC compatibility, and maintain transparent coordination.
          </p>
        </div>

        {/* 4 Compact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-slate-50/60 hover:bg-white p-6 rounded-3xl border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`p-3 rounded-2xl border inline-flex mb-4 ${card.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
