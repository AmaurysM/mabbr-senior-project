import React from 'react';

import features from './constants/Features';
import HeroSection from './components/LandingPage/HeroSection';
import FeaturesSection from './components/LandingPage/FeaturesSection';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <HeroSection />      

      <FeaturesSection features={features} />
    </div>
  );
};

export default HomePage;
