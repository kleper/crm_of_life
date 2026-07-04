import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={`w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
            error ? "border-red-500 focus:ring-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <span id={errorId} className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    const generatedId = useId();
    const selectId = props.id || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label htmlFor={selectId} className="text-sm font-medium text-slate-700">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={`w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
            error ? "border-red-500 focus:ring-red-500" : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span id={errorId} className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
