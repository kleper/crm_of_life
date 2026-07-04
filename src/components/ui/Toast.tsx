import { useEffect, useState } from "react";
import { X } from "./Icons";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
}

export function Toast({ message, type = "info", duration = 8000, onClose, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-indigo-50 border-indigo-200 text-indigo-800"
  };

  return (
    <div
      role="alert"
      className={`fixed bottom-20 md:bottom-4 right-4 z-50 p-4 border shadow-lg flex flex-col gap-2 max-w-sm rounded-none motion-safe:animate-in motion-safe:slide-in-from-right ${bgColors[type]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          aria-label="Cerrar notificación"
          className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
