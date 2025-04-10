import React from 'react'


const SkeletonLoader = ({ width, height,className }: { width?: string; height?: string; className?: string }) => (
    <div
    className={`animate-pulse bg-gray-700 rounded-lg ${className || ''}`}
        style={{ width: width || '100%', height: height || '1rem' }}
    />
);

export default SkeletonLoader