import React from 'react';
import { Target, Zap, Clock, UserPlus, Repeat, Network } from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      title: 'Smart Donor Matching',
      description: 'Prioritize potential donors using multiple factors such as compatibility rules, distance, availability, and urgency.',
      icon: Target,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      title: 'Emergency Requests',
      description: 'Create, dispatch, and track high-priority blood requirements from a single unified responder dashboard.',
      icon: Zap,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Real-Time Coordination',
      description: 'Keep donors, coordinators, and receivers synchronized throughout the lifecycle of the request.',
      icon: Clock,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Backup Donors',
      description: 'If the initial wave of matched donors does not respond, the search automatically expands to backup tiers.',
      icon: UserPlus,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Recurring Donor Networks',
      description: 'Build reliable, scheduled donor pools for thalassemia, chemotherapy, or other recurring blood needs.',
      icon: Repeat,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Community Networks',
      description: 'Mobilize organized donor chapters across universities, corporations, NGOs, and local neighborhoods.',
      icon: Network,
      color: 'text-indigo-600 bg-indigo-50',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Built for Faster Blood Response
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A comprehensive, technology-driven toolkit designed to replace outdated donor directories and manual phone tag.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feat) => (
            <div 
              key={feat.title}
              className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className={`p-3 rounded-xl inline-block mb-5 ${feat.color} group-hover:scale-110 transition-transform duration-200`}>
                <feat.icon className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                {feat.title}
              </h3>
              
              <p className="text-sm text-slate-600 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
