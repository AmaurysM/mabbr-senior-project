import React from 'react';

interface LoadingStateProps {
    text?: string;
}

const LoadingStateAnimation: React.FC<LoadingStateProps> = ({ text }) => {
    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
            {text && <span className="text-gray-300 text-lg">{text}</span>}
        </div>
    );
};

export default LoadingStateAnimation;
