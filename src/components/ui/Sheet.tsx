"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from './Icons';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = title ? `sheet-title-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      sheetRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Sheet Content */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full sm:w-[480px] bg-white h-[90vh] sm:h-full flex flex-col transform transition-transform sm:border-l border-slate-200 shadow-2xl rounded-none"
      >
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 id={titleId} className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            aria-label="Cerrar"
            className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors rounded-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
