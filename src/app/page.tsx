import React from 'react';
import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-800">Welcome to Our Web APP</h1>
      <p className="text-lg text-gray-600 mt-4">
        Discover and invest the stock of your dreams.
      </p>
      <div className="mt-6 flex space-x-4">
        <Link href="/home" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
          View Stocks
        </Link>
        <Link href="/login" className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition">
          Login
        </Link>
      </div>
    </div>
  );
};

export default HomePage;