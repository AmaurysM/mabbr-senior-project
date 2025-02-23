import React, { useState } from "react";

interface FeatureCardProps {
    title: string;
    who: string;
    what: string;
    why: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, who, what, why }) => {

    return (
        <div
            className="relative group"
        >
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 blur-xl transition-opacity duration-500 `} />
            
            <div
                className="relative h-full p-8 rounded-xl bg-gradient-to-br from-blue-900/90 via-blue-800/90 to-blue-700/90 backdrop-blur-sm border border-blue-700/20 shadow-lg transition-all duration-200"

            >
                <div className="transform-style-preserve-3d">
                    <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white mb-6">
                        {title}
                    </h3>

                    <div className="space-y-4 text-blue-100">
                        <div className="transform translate-z-20">
                            <span className="text-blue-300 font-medium">Who: </span>
                            <span className="text-blue-100">{who}</span>
                        </div>
                        
                        <div className="transform translate-z-20">
                            <span className="text-blue-300 font-medium">What: </span>
                            <span className="text-blue-100">{what}</span>
                        </div>
                        
                        <div className="transform translate-z-20">
                            <span className="text-blue-300 font-medium">Why: </span>
                            <span className="text-blue-100">{why}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeatureCard;
export type { FeatureCardProps };