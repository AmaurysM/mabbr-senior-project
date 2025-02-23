"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';

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
    <div className="relative flex flex-col items-center justify-center bg-blue-600 text-white text-center min-h-screen py-6">
      <h1 className="text-4xl font-bold">Welcome to Our Web APP</h1>
      <p className="text-lg mt-4">Discover and invest the stocks of your dreams.</p>
      <div className="mt-6 flex space-x-4">
        <Link
          href="/home"
          className="px-6 py-3 bg-blue-700 text-white rounded-lg shadow-md hover:bg-blue-800 transition-colors"
        >
          View Stocks
        </Link>
        <Link
          href="/login-signup"
          className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition-colors"
          prefetch={true}
        >
          Login
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;