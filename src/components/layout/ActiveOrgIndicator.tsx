"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export type TenantInfo = {
  tenantId: string;
  name: string;
  role: string;
};

interface ActiveOrgIndicatorProps {
  userTenants: TenantInfo[];
  activeTenantId: string | null;
  isSuperAdmin: boolean;
}

export function ActiveOrgIndicator({ userTenants, activeTenantId, isSuperAdmin }: ActiveOrgIndicatorProps) {
  const pathname = usePathname();
  const { update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSystemMode = isSuperAdmin && pathname?.startsWith("/admin");
  const activeTenant = userTenants.find(t => t.tenantId === activeTenantId) || userTenants[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (tenantId: string) => {
    setIsOpen(false);
    if (tenantId !== activeTenantId) {
      await update({ tenantId });
      window.location.href = "/tasks";
    }
  };

  // ESTADO 3: MODO SISTEMA
  if (isSystemMode) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold shadow-sm">
        <span>🛠️</span>
        <span className="hidden sm:inline">Modo Sistema Global</span>
        <span className="sm:hidden">Sistema Global</span>
      </div>
    );
  }

  // Si no hay tenants, no muestra nada
  if (userTenants.length === 0) return null;

  // ESTADO 1: MONOTAREA
  if (userTenants.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium">
        <span>🏢</span>
        <span className="truncate max-w-[150px] sm:max-w-[200px]">{activeTenant?.name || "Mi Organización"}</span>
      </div>
    );
  }

  // ESTADO 2: MULTITAREA
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-sm font-medium transition-colors"
      >
        <span>🏢</span>
        <span className="truncate max-w-[120px] sm:max-w-[200px]">{activeTenant?.name || "Seleccionar..."}</span>
        <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 shadow-lg z-50 flex flex-col">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tus Organizaciones
          </div>
          <div className="max-h-60 overflow-y-auto">
            {userTenants.map((t) => (
              <button
                key={t.tenantId}
                onClick={() => handleSelect(t.tenantId)}
                className={`w-full text-left px-4 py-3 flex flex-col hover:bg-indigo-50 border-b border-slate-100 last:border-0 ${
                  activeTenantId === t.tenantId ? "bg-indigo-50/50" : ""
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-sm ${activeTenantId === t.tenantId ? "font-bold text-indigo-700" : "font-medium text-slate-700"}`}>
                    {t.name}
                  </span>
                  {activeTenantId === t.tenantId && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 border border-indigo-200">
                      Activa
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 mt-1">{t.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
