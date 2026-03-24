import React from "react";

export default function ProgressBar({ value, color = "#6366f1", height = 6 }) {
  return (
    <div className="w-full bg-white/10 overflow-hidden" style={{ height, borderRadius: height }}>
      <div 
        className="h-full transition-all duration-1000 ease-out" 
        style={{ width: `${value}%`, backgroundColor: color, borderRadius: height }} 
      />
    </div>
  );
}