"use client";

import React, { useEffect, useState } from "react";

type Bubble = {
  size: number;
  x: number;
  y: number;
  delay: number;
};

const Bubble: React.FC<{ numBubbles?: number }> = ({ numBubbles = 10 }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const newBubbles: Bubble[] = [];
    const minDistance = 100; // Minimum distance between bubbles
    const maxX = window.innerWidth + 200; // Allow outside screen
    const maxY = window.innerHeight + 200;

    for (let i = 0; i < numBubbles; i++) {
      let newBubble: Bubble;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        newBubble = {
          size: Math.random() * 80 + 40,
          x: Math.random() * maxX - 100, // Allow some off-screen placement
          y: Math.random() * maxY - 100,
          delay: Math.random() * 5,
        };

        attempts++;
      } while (
        attempts < maxAttempts &&
        newBubbles.some(
          (bubble) =>
            Math.hypot(bubble.x - newBubble.x, bubble.y - newBubble.y) <
            minDistance
        )
      );

      newBubbles.push(newBubble);
    }

    setBubbles(newBubbles);
  }, []); // Runs once on mount

  return (
    <div className="floating-circles absolute top-0 left-0 w-full h-full z-0 overflow-visible">
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          className="circle"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            animationDelay: `${bubble.delay}s`,
            position: "absolute", // Keep bubbles fixed in place
          }}
        ></div>
      ))}
    </div>
  );
};

export default Bubble;
