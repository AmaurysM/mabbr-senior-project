import React, { Suspense } from "react";
import FeatureCard, { FeatureCardProps } from "../FeatureCardProps";

const FeaturesSection = ({ features }: { features: FeatureCardProps[] }) => {
  return (
    <div className="relative py-24 bg-gradient-to-br from-blue-950 to-blue-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <div className="absolute h-96 w-96 left-1/4 top-1/4 rounded-full bg-blue-500 max-w-full" />
        <div className="absolute h-96 w-96 right-1/4 bottom-1/4 rounded-full bg-blue-400 max-w-full" />
      </div>

      <div className="relative container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
            Upcoming Features
          </h2>
          <p className="mt-4 text-lg text-blue-200">
            Discover what&apos;s next for our trading platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Suspense
              key={index}
              fallback={
                <div className="h-64 bg-blue-800/50 rounded-xl animate-pulse" />
              }
            >
              <FeatureCard {...feature} />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;