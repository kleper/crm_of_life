"use client";

import { useToastStore } from "@/lib/toast";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[100] bottom-20 md:bottom-6 right-0 md:right-6 left-0 md:left-auto flex flex-col gap-2 pointer-events-none px-4 md:px-0 items-center md:items-end">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        
        return (
          <div 
            key={toast.id}
            className={`pointer-events-auto rounded-none shadow-lg px-4 py-3 flex items-center justify-between min-w-[280px] max-w-sm w-full md:w-auto text-sm font-medium transform transition-all duration-300 animate-slide-up bg-white border-l-4 ${
              isSuccess ? "border-emerald-500 text-slate-800" :
              isError ? "border-red-500 text-slate-800" :
              "border-blue-500 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <span className="text-emerald-500 text-lg">✓</span>}
              {isError && <span className="text-red-500 text-lg">⚠</span>}
              {!isSuccess && !isError && <span className="text-blue-500 text-lg">ℹ</span>}
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 ml-4 px-2 py-1"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
