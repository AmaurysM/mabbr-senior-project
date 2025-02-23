import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy Load components
const Bubble = dynamic(() => import('./components/Bubble'));
import features from './constants/Features';
import HeroSection from './components/LandingPage/HeroSection';
import FeaturesSection from './components/LandingPage/FeaturesSection';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <HeroSection />
      
      {/* Background Animation - Load after main content */}
      <Suspense fallback={null}>
        <div className="floating-circles absolute -inset-3 top-0 left-0 w-full h-full z-0">
          <Bubble maxBubbles={15} />
        </div>
      </Suspense>

      <FeaturesSection features={features} />
    </div>
  );
};

export default HomePage;
