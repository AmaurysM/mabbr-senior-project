import React from "react";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/sunny-landscape-tini.jpg')" }}
        />
      </div>
      <div className="w-full max-w-lg p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg text-center">
        <div className="relative">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <ExclamationTriangleIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-lg text-blue-900/70 mb-8">
            The page you are looking for seems to have floated away...
          </p>

          <Link href="/">
            <span className="inline-block px-8 py-3 bg-blue-500 text-white font-medium rounded-full shadow-md hover:bg-blue-600 hover:shadow-lg transition-all duration-200">
              Return Home
            </span>
          </Link>
        </div>

        {/* Decorative Bubbles */}
        <div className="absolute top-20 -left-4 w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm" />
        <div className="absolute bottom-8 -right-6 w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm" />
        <div className="absolute top-1/2 -right-2 w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm" />
        <div className="absolute bottom-20 -left-6 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm" />
      </div>
    </div>
  );
};

export default NotFoundPage;
