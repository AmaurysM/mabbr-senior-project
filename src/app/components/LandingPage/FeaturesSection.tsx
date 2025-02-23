import { Suspense } from "react";
import FeatureCard, { FeatureCardProps } from "../FeatureCardProps";

const FeaturesSection = ({ features }: { features: FeatureCardProps[] }) => (
    <div className="flex flex-col items-center justify-center p-6 mt-12">
        <h2 className="text-3xl font-bold text-gray-800">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {features.map((feature, index) => (
                <Suspense key={index} fallback={<div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>}>
                    <FeatureCard {...feature} />
                </Suspense>
            ))}
        </div>
    </div>
);

export default FeaturesSection;