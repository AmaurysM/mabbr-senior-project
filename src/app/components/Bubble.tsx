"use client";

import React, { useEffect, useState } from "react";

type Bubble = {
  id: number;
  size: number;
  x: number;
  speed: number;
};

const Bubble: React.FC<{ maxBubbles?: number }> = ({ maxBubbles = 10 }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const createBubble = () => ({
      id: Math.random(),
      size: Math.random() * 80 + 40,
      x: Math.random() * window.innerWidth,
      speed: Math.random() * 5 + 2, // Random speed between 2s - 7s
    });

    setBubbles(Array.from({ length: Math.min(maxBubbles, Math.floor(window.innerWidth / 200)) }, createBubble));

    const interval = setInterval(() => {
      setBubbles((prevBubbles) => {
        // Only add a new bubble if we have room
        if (prevBubbles.length >= maxBubbles) {
          return prevBubbles;
        }
        return [...prevBubbles, createBubble()];
      });
    }, 1000); // Try adding a new bubble every second
    

    return () => clearInterval(interval);
  }, [maxBubbles]);

  return (
    <div className="floating-circles absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="circle"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}px`,
            bottom: "-100px", // Start below the screen
            position: "absolute",
            // backgroundImage: "url('/path-to-your-image.png')", // Replace with actual image
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "50%",
            animation: `floatUp ${bubble.speed}s linear infinite`,
          }}          
        ></div>
      ))}
      <style>
        {`
          @keyframes floatUp {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-110vh); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default Bubble;
