import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Features } from '../components/Features';
import { TwoWayNetwork } from '../components/TwoWayNetwork';
import { WhyRaktsetu } from '../components/WhyRaktsetu';
import { TrustSafety } from '../components/TrustSafety';
import { EmergencyCTA } from '../components/EmergencyCTA';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-rose-500 selection:text-white">
      {/* 1. Navbar */}
      <Navbar />
      
      <main>
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. How It Works */}
        <HowItWorks />

        {/* 4. Key Features */}
        <Features />

        {/* 5. Two-Way Blood Network */}
        <TwoWayNetwork />

        {/* 6. Why Raktsetu (Traditional Search vs Raktsetu) */}
        <WhyRaktsetu />

        {/* 7. Trust & Safety (Between Traditional Search vs Raktsetu and Emergency CTA) */}
        <TrustSafety />

        {/* 8. Emergency CTA (Need Blood Urgently?) */}
        <EmergencyCTA />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};
