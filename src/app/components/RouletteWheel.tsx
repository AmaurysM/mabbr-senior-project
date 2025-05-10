"use client";

import React, { useEffect, useRef, useState } from "react";

interface RouletteWheelProps {
  order: number[];                // sequence of numbers in wheel order
  redSet: Set<number>;            // which numbers are red
  rotation: number;               // current wheel rotation (degrees)
  spinning: boolean;              // is the wheel animating?
  onStop: () => void;             // callback when spin ends
}

export default function RouletteWheel({
  order,
  redSet,
  rotation,
  spinning,
  onStop,
}: RouletteWheelProps) {
  const SEGMENT_ANGLE = 360 / order.length;
  const wheelRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<
    { x: number; y: number; value: number }[]
  >([]);

  // Build and attach transitionend listener
  useEffect(() => {
    if (!spinning) return;
    const el = wheelRef.current!;
    const handler = () => {
      onStop();
      el.removeEventListener("transitionend", handler);
    };
    el.addEventListener("transitionend", handler);
    return () => el.removeEventListener("transitionend", handler);
  }, [spinning, onStop]);

  // Once the wheel div mounts, compute label positions
  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const radius = width / 2;
    const labelRadius = radius * 0.85; // place labels 85% out
    const centerX = radius;
    const centerY = height / 2;

    const newLabels = order.map((num, idx) => {
      const angleDeg = idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: centerX + Math.cos(rad) * labelRadius,
        y: centerY + Math.sin(rad) * labelRadius,
        value: num,
      };
    });
    setLabels(newLabels);
  }, [order, SEGMENT_ANGLE]);

  // Build conic gradient CSS
  const gradientStops = order
    .map((num, i) => {
      const start = (i * SEGMENT_ANGLE).toFixed(2);
      const end = ((i + 1) * SEGMENT_ANGLE).toFixed(2);
      let color = redSet.has(num) ? "#dc2626" : "#1f2937";
      if (num === 0) color = "#16a34a";
      return `${color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-10 bg-yellow-400 rounded-b z-10" />

      {/* Wheel */}
      <div
        ref={wheelRef}
        className="w-full h-full rounded-full border-8 border-yellow-300"
        style={{
          background: `conic-gradient(${gradientStops})`,
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? "transform 5s cubic-bezier(0.33,1,0.68,1)"
            : "none",
        }}
      />

      {/* Labels */}
      {labels.map((lbl, i) => (
        <div
          key={i}
          className="absolute text-xs font-bold text-white pointer-events-none"
          style={{
            left: lbl.x,
            top: lbl.y,
            transform: `translate(-50%, -50%) rotate(${-rotation - (lbl.value === 0 ? 0 : i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)}deg)`,
          }}
        >
          {lbl.value}
        </div>
      ))}
    </div>
  );
}
