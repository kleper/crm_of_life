"use client";

import { useEffect, useState } from "react";

export interface Achievement {
  title: string;
  icon: string;
}

interface ToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementToast({ achievement, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // wait for fade out
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-slate-900 text-white p-4 shadow-xl border-l-4 border-amber-400 min-w-[300px] flex items-center gap-4">
        <div className="text-3xl">{achievement.icon}</div>
        <div>
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">¡Logro Desbloqueado!</p>
          <h4 className="font-semibold">{achievement.title}</h4>
        </div>
      </div>
    </div>
  );
}
