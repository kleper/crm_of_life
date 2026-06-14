"use client";

import { createTenantAction } from "@/app/admin/actions";
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
      {pending ? "Creando..." : "Crear Organización"}
    </Button>
  );
}

export default function CreateTenantForm() {
  return (
    <div className="bg-white p-6 border border-amber-200 shadow-sm rounded-none relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl pointer-events-none">🏢</div>
      <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider border-b border-amber-100 pb-2">Nueva Organización</h2>
      <form action={createTenantAction} className="flex flex-col gap-6 relative z-10">
        
        <div>
          <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Organización</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
            placeholder="Ej. Acme Corp"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="adminName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Admin</label>
            <input
              type="text"
              id="adminName"
              name="adminName"
              required
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="adminEmail" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo del Admin</label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              required
              autoComplete="email"
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
              placeholder="admin@acme.com"
            />
          </div>
          <div>
            <label htmlFor="adminPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña del Admin</label>
            <input
              type="password"
              id="adminPassword"
              name="adminPassword"
              required
              autoComplete="new-password"
              className="w-full border border-slate-300 p-3 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2 pt-6 border-t border-amber-100">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
