// components/FeatureCard.tsx
import React from 'react';

interface FeatureCardProps {
    title: string;
    who: string;
    what: string;
    why: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, who, what, why }) => {
    return (
        <div className="max-w-sm rounded-lg shadow-lg bg-white p-6">
        <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
        <p className="text-lg font-medium text-gray-700 mt-4">Who: {who}</p>
        <p className="text-gray-600 mt-2">What: {what}</p>
        <p className="text-gray-600 mt-2">Why: {why}</p>
        </div>
    );
};

export default FeatureCard;
export type { FeatureCardProps };
