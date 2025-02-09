import React from 'react';
import Link from 'next/link';
import FeatureCard from './components/FeatureCardProps';
import features from './constants/Features';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center bg-blue-600 text-white text-center min-h-screen py-6">
        <h1 className="text-4xl font-bold">Welcome to Our Web APP</h1>
        <p className="text-lg mt-4">Discover and invest the stocks of your dreams.</p>
        <div className="mt-6 flex space-x-4">
          <Link href="/home" className="px-6 py-3 bg-blue-700 text-white rounded-lg shadow-md hover:bg-blue-800 transition">
            View Stocks
          </Link>
          <Link href="/login" className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition">
            Login
          </Link>
        </div>
      </div>

      {/* Background Animation */}
      <div className="floating-circles absolute top-0 left-0 w-full h-full z-0">
        <div className="circle animation-delay-1"></div>
        <div className="circle animation-delay-2"></div>
        <div className="circle animation-delay-3"></div>
        <div className="circle animation-delay-4"></div>
      </div>

      {/* Features Section */}
      <div className="flex flex-col items-center justify-center p-6 mt-12">
        <h2 className="text-3xl font-bold text-gray-800">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {features.map((feature: any, index: any) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
