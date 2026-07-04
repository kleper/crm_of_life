import React from "react";
import { Button } from "./Button";
import { Clipboard } from "./Icons";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 md:p-12 text-center border border-slate-200 bg-white shadow-sm rounded-none ${className}`}>
      <div className="text-slate-300 mb-6 w-16 h-16 flex items-center justify-center">
        {icon || <Clipboard className="w-10 h-10" />}
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mx-auto mb-4 md:mb-8 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button variant="accent" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
