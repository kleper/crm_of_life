import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;
  const currentTenantRole = (session.user as any).selectedTenantRole;

  return (
    <main className="flex flex-col flex-1 p-6 h-full bg-amber-50">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        <div className="bg-amber-100 border border-amber-300 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Warning Stripes Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 10px, transparent 10px, transparent 20px)' }}></div>
          
          <div className="relative z-10 flex flex-col items-start gap-2">
            <h1 className="text-2xl font-black text-amber-900 tracking-tight uppercase">Modo Sistema</h1>
            <p className="text-sm text-amber-800 font-bold">Administración de plataforma y configuración global.</p>
          </div>
          <div className="relative z-10 flex gap-4 items-center">
            <Link href="/tasks">
              <Button variant="secondary" className="border-amber-400 text-amber-900 hover:bg-amber-200">
                &larr; Volver a Tareas
              </Button>
            </Link>
            <form action={async () => {
              "use server";
              await signOut();
            }}>
              <Button type="submit" variant="destructive">
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Card for Tenants (Only SuperAdmin) */}
          {isSuperAdmin ? (
            <Link href="/admin/tenants" className="block bg-white border border-amber-200 shadow-sm rounded-none hover:border-amber-500 transition-all group hover:-translate-y-1">
              <div className="p-6">
                <div className="text-5xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">🏢</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-amber-700 transition-colors uppercase tracking-wider">Organizaciones</h2>
                <p className="text-sm font-medium text-slate-500 mb-6 line-clamp-2">Gestiona los espacios de trabajo, inquilinos (Tenants) y configuración global de la plataforma.</p>
              </div>
              <div className="w-full text-center py-3 px-4 bg-amber-100 text-amber-900 font-black uppercase tracking-wider group-hover:bg-amber-200 transition-colors text-xs">
                Administrar Organizaciones &rarr;
              </div>
            </Link>
          ) : (
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-none opacity-60 flex flex-col">
              <div className="p-6">
                <div className="text-5xl mb-4 opacity-50 grayscale">🏢</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wider">Organizaciones</h2>
                <p className="text-sm font-medium text-slate-500 mb-6">Acceso restringido. Requiere permisos de Súper Administrador.</p>
              </div>
              <div className="mt-auto w-full text-center py-3 px-4 bg-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                Bloqueado 🔒
              </div>
            </div>
          )}

          {/* Card for Users */}
          {(isSuperAdmin || currentTenantRole === "TENANT_ADMIN") ? (
            <Link href="/admin/users" className="block bg-white border border-amber-200 shadow-sm rounded-none hover:border-amber-500 transition-all group hover:-translate-y-1">
              <div className="p-6">
                <div className="text-5xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">👥</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 group-hover:text-amber-700 transition-colors uppercase tracking-wider">Usuarios</h2>
                <p className="text-sm font-medium text-slate-500 mb-6 line-clamp-2">Administra los usuarios de tu entorno actual. Asigna roles y accesos.</p>
              </div>
              <div className="w-full text-center py-3 px-4 bg-amber-100 text-amber-900 font-black uppercase tracking-wider group-hover:bg-amber-200 transition-colors text-xs">
                Administrar Usuarios &rarr;
              </div>
            </Link>
          ) : (
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-none opacity-60 flex flex-col">
              <div className="p-6">
                <div className="text-5xl mb-4 opacity-50 grayscale">👥</div>
                <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wider">Usuarios</h2>
                <p className="text-sm font-medium text-slate-500 mb-6">Acceso restringido. Necesitas permisos de Administrador de Tenant.</p>
              </div>
              <div className="mt-auto w-full text-center py-3 px-4 bg-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                Bloqueado 🔒
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
