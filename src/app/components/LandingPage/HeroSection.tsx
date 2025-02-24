"use client";
import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, Shield } from 'lucide-react';
import dynamic from 'next/dynamic';

const Bubble = dynamic(() => import('../Bubble'));

const HeroSection = () => {
  useEffect(() => {
    const preloadLoginPage = () => {
      const linkTag = document.createElement('link');
      linkTag.rel = 'preload';
      linkTag.as = 'fetch';
      linkTag.href = '/login-signup';
      linkTag.crossOrigin = 'anonymous';
      document.head.appendChild(linkTag);
    };
    preloadLoginPage();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute h-96 w-96 -left-16 -top-16 rounded-full bg-blue-500" />
        <div className="absolute h-96 w-96 -right-16 -bottom-16 rounded-full bg-blue-400" />
      </div>

      {/* Back ground animation */}
      <Suspense fallback={null}>
        <div className="floating-circles absolute -inset-3 top-0 left-0 w-full h-full z-0">
          <Bubble maxBubbles={15} />
        </div>
      </Suspense>

      {/* Main Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-16 text-white">
        <div className="max-w-4xl text-center ">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text pb-1 text-transparent bg-gradient-to-r from-blue-200 to-white">
            Trade Smarter, Together
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Join the community where social insights meet smart investing
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Real-time Trading",
                desc: "Access live market data"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Social Network",
                desc: "Follow top traders"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Secure Platform",
                desc: "Bank-grade security"
              }
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center p-6 rounded-xl bg-white/5 backdrop-blur-sm">
                {feature.icon}
                <h3 className="text-lg font-semibold mt-4">{feature.title}</h3>
                <p className="text-blue-200 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/home"
              className="px-8 py-4 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors border border-blue-600"
            >
              Start Trading
            </Link>
            <Link
              href="/login-signup"
              className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors border border-blue-600"
              prefetch={true}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;