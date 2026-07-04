"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "../LogoutButton";
import { ActiveOrgIndicator, TenantInfo } from "./ActiveOrgIndicator";
import Icons from "@/components/ui/Icons";

interface NavigationClientProps {
  canManage: boolean;
  userName: string;
  userTenants: TenantInfo[];
  activeTenantId: string | null;
  isSuperAdmin: boolean;
  unreadCount?: number;
}

export default function NavigationClient({ canManage, userName, userTenants, activeTenantId, isSuperAdmin, unreadCount = 0 }: NavigationClientProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Icons.Dashboard },
    { name: "Tareas", href: "/tasks", icon: Icons.CheckSquare },
    { name: "Contactos", href: "/contacts", icon: Icons.Users },
    { name: "Finanzas", href: "/finance", icon: Icons.Wallet },
    { name: "Kudos", href: "/kudos", icon: Icons.Trophy },
  ];

  const adminItems = [
    { name: "Panel Admin", href: "/admin", icon: Icons.Settings },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <Link href="/dashboard" className="font-black text-indigo-700 tracking-tighter">CRM VIDA</Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" aria-label="Notificaciones" className="relative w-11 h-11 flex items-center justify-center text-slate-600">
            <Icons.Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú"
            className="w-11 h-11 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            {isMobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sub-bar for Mobile Active Org Indicator */}
      <div className="md:hidden fixed top-14 left-0 w-full bg-slate-50 border-b border-slate-200 z-30 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contexto:</span>
        <ActiveOrgIndicator userTenants={userTenants} activeTenantId={activeTenantId} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Mobile Hamburger Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[104px] bg-white z-40 p-4 flex flex-col gap-4 overflow-y-auto pb-20">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{userName}</div>
              <div className="text-xs text-slate-500">Mi Cuenta</div>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4">Configuración</span>
              {adminItems.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center p-4 border cursor-pointer ${isActive(item.href) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <item.icon className="w-5 h-5 mr-3" /> {item.name}
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-auto px-4">
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t border-slate-200 z-50 flex justify-around items-center">
        {navItems.map(item => (
          <Link 
            key={item.href} 
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive(item.href)
                ? 'text-indigo-600 border-t-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800 border-t-2 border-transparent'
            }`}
          >
            <item.icon className="w-6 h-6 mb-0.5" />
            <span className="text-[10px] font-bold">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-[100dvh] sticky top-0 z-10 shrink-0">
        <div className="h-16 flex items-center px-4 border-b border-slate-200 justify-between">
          <Link href="/dashboard" className="font-black text-xl text-indigo-700 tracking-tighter">
            CRM VIDA
          </Link>
          <Link href="/notifications" aria-label="Notificaciones" className="relative text-slate-600 hover:text-indigo-600 transition-colors">
            <Icons.Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
        
        {/* Sub-header for Active Org */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Entorno de Trabajo</div>
          <ActiveOrgIndicator userTenants={userTenants} activeTenantId={activeTenantId} isSuperAdmin={isSuperAdmin} />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            {navItems.map(item => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center px-4 py-3 font-medium transition-colors ${
                  isActive(item.href) 
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" /> {item.name}
              </Link>
            ))}
          </div>

          {/* Configuración (Solo Admin) */}
          {canManage && (
            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-3">Configuración</div>
              
              <Link href="/settings/general" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${isActive('/settings/general') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icons.Globe className="w-5 h-5 opacity-70" />
                General
              </Link>
              
              <Link href="/settings/categories" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${isActive('/settings/categories') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icons.Tag className="w-5 h-5" /> Categorías
              </Link>
              <Link href="/settings/notifications" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${isActive('/settings/notifications') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icons.Bell className="w-5 h-5" /> Notificaciones
              </Link>

              {isSuperAdmin && (
                <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icons.Settings className="w-5 h-5 opacity-70" />
                  Panel Admin
                </Link>
              )}
            </div>
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-200 relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                {userInitials}
              </div>
              <span className="text-sm font-bold text-slate-700 truncate">{userName}</span>
            </div>
            <Icons.ChevronUp className="w-4 h-4 text-slate-400" />
          </button>
          
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-200 shadow-lg z-50 p-2 flex flex-col gap-2">
              <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                Mi Perfil
              </Link>
              <LogoutButton />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
