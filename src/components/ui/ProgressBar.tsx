import React from "react";

interface ProgressBarProps {
  percentage: number;
  colorClass?: string;
  className?: string;
}

export function ProgressBar({ 
  percentage, 
  colorClass = "bg-blue-500",
  className = "" 
}: ProgressBarProps) {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`w-full h-1.5 bg-slate-100 border border-slate-200 rounded-none overflow-hidden ${className}`}>
      <div 
        className={`h-full ${colorClass} transition-all duration-300`} 
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}
