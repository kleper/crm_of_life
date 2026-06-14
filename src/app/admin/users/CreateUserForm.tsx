"use client";

import { createUserAction } from "@/app/admin/actions";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="bg-amber-600 hover:bg-amber-700 text-white uppercase tracking-wider text-xs font-bold px-8"
    >
      {pending ? "Creando..." : "Crear Usuario"}
    </Button>
  );
}

export default function CreateUserForm() {
  return (
    <div className="bg-white p-6 border border-amber-200 shadow-sm rounded-none relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl pointer-events-none">👥</div>
      <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider border-b border-amber-100 pb-2">Nuevo Usuario</h2>
      <form action={createUserAction} className="flex flex-col gap-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              autoComplete="name"
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              autoComplete="email"
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              autoComplete="new-password"
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol</label>
            <select 
              id="role" 
              name="role" 
              required
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
            >
              <option value="USER">Usuario (USER)</option>
              <option value="TENANT_ADMIN">Admin. de Organización (TENANT_ADMIN)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-2 pt-6 border-t border-amber-100">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
