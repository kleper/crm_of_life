import React from "react";
import { Button } from "./Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actionLabel, onAction, children, className }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className || "mb-8"}`}>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-600 mt-2">{description}</p>}
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        {children}
        {actionLabel && onAction && (
          <Button variant="accent" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
