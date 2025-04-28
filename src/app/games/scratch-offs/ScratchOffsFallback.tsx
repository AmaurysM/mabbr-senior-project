"use client";

import React from 'react';
import { useToast } from '@/app/hooks/use-toast';

interface ScratchOffsFallbackProps {
  onRetry: () => void;
  errorMessage?: string;
}

const ScratchOffsFallback: React.FC<ScratchOffsFallbackProps> = ({ 
  onRetry,
  errorMessage = "We're having trouble connecting to the service right now."
}) => {
  const { toast } = useToast();
  
  const handleRetry = () => {
    toast({
      title: "Retrying...",
      description: "Attempting to reconnect to the service.",
    });
    onRetry();
  };
  
  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white mb-4">Scratch Offs</h1>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          
          <h2 className="text-xl font-semibold text-white mb-2">Connection Issue</h2>
          <p className="text-gray-400 mb-6">{errorMessage}</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="text-sm text-gray-500">
            <p className="mb-2">If this issue persists:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your internet connection</li>
              <li>Try clearing your browser cache</li>
              <li>Log out and log back in</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScratchOffsFallback; 