import React, { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "alert" | "highlighted" | "ghost";
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", variant = "default", noPadding = false, ...props }, ref) => {
    const baseStyles = "rounded-none transition-colors";
    
    const variants = {
      default: "bg-white border border-slate-200 shadow-sm",
      alert: "bg-red-50/50 border border-red-300 shadow-sm",
      highlighted: "bg-blue-50/50 border border-blue-200 shadow-sm",
      ghost: "bg-transparent border-transparent"
    };

    const paddingClass = noPadding ? "" : "p-6";

    return (
      <div 
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddingClass} ${className}`} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
