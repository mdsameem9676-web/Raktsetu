import React from 'react';
import { PlusCircle, Activity, Bell, Handshake } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Create a Request',
      description: 'A receiver creates a blood requirement with blood group, hospital, location, and urgency status.',
      icon: PlusCircle,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      num: '02',
      title: 'Intelligent Matching',
      description: 'Raktsetu identifies, scores, and prioritizes suitable nearby donors in real time.',
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      num: '03',
      title: 'Donor Responds',
      description: 'Potential compatible donors receive instant notifications and can accept or decline securely.',
      icon: Bell,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      num: '04',
      title: 'Connect & Coordinate',
      description: 'The platform coordinates donor and receiver contact, hospital arrival, and completion tracking.',
      icon: Handshake,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Background shape */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            How Raktsetu Works
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A simplified, automated lifecycle engineered to bridge the gap between donor and receiver in minutes.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Desktop Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-12 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step) => (
              <div 
                key={step.num}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 group hover:-translate-y-1"
              >
                {/* Step Icon & Number Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-xl border ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-100 group-hover:text-rose-100 transition-colors tracking-tight font-mono">
                    {step.num}
                  </span>
                </div>

                {/* Step Body */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
