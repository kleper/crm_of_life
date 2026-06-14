import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import CreateUserForm from "./CreateUserForm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const prisma = new PrismaClient();

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;
  const currentTenantRole = (session.user as any).selectedTenantRole;
  const currentTenantId = (session.user as any).selectedTenantId;

  if (!isSuperAdmin && currentTenantRole !== "TENANT_ADMIN") {
    redirect("/admin");
  }

  if (!currentTenantId) {
    return (
      <main className="flex flex-col flex-1 p-6 h-full bg-amber-50">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-6 border border-amber-200 shadow-sm rounded-none text-center py-12">
             <div className="text-4xl mb-4">⚠️</div>
             <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wider">No se ha seleccionado una organización</h2>
             <p className="text-slate-500 mb-6 font-medium">Debes seleccionar una organización para administrar sus usuarios.</p>
             <Link href="/admin">
               <Button variant="secondary" className="border-amber-300 text-amber-900">Volver a Administración</Button>
             </Link>
          </div>
        </div>
      </main>
    );
  }

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: currentTenantId },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="flex flex-col flex-1 p-6 h-full bg-amber-50">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        <div className="bg-amber-100 border border-amber-300 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Warning Stripes Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 10px, transparent 10px, transparent 20px)' }}></div>
          
          <div className="relative z-10 flex flex-col items-start gap-2">
            <h1 className="text-2xl font-black text-amber-900 tracking-tight uppercase">Usuarios</h1>
            <p className="text-sm text-amber-800 font-bold">Administración de accesos de la organización actual.</p>
          </div>
          <div className="relative z-10 flex gap-4 items-center">
            <Link href="/admin">
              <Button variant="secondary" className="border-amber-400 text-amber-900 hover:bg-amber-200">
                &larr; Volver
              </Button>
            </Link>
          </div>
        </div>

        <CreateUserForm />

        <div className="bg-white border border-amber-200 shadow-sm rounded-none overflow-hidden mt-8">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-amber-100 border-b border-amber-200">
                <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs">Nombre</th>
                <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs">Email</th>
                <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs">Rol</th>
                <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs">Fecha de Creación</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {tenantUsers.map((tu, idx) => (
                <tr key={tu.id} className={`block md:table-row border-b border-slate-200 md:border-slate-100 transition-colors hover:bg-amber-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} p-4 md:p-0`}>
                  <td className="flex md:table-cell justify-between items-center md:p-4 text-slate-700 font-bold mb-2 md:mb-0">
                    <span className="md:hidden text-xs font-black text-amber-900 uppercase tracking-wider">Nombre</span>
                    <span className="text-right">{tu.user.name || "Sin nombre"}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center md:p-4 text-slate-600 font-medium mb-2 md:mb-0">
                    <span className="md:hidden text-xs font-black text-amber-900 uppercase tracking-wider">Email</span>
                    <span className="text-right truncate max-w-[200px] sm:max-w-none">{tu.user.email}</span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center md:p-4 mb-2 md:mb-0">
                    <span className="md:hidden text-xs font-black text-amber-900 uppercase tracking-wider">Rol</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                      tu.role === 'TENANT_ADMIN' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {tu.role === 'TENANT_ADMIN' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center md:p-4 text-slate-500 font-medium">
                    <span className="md:hidden text-xs font-black text-amber-900 uppercase tracking-wider">Fecha</span>
                    <span>{new Date(tu.createdAt).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
              {tenantUsers.length === 0 && (
                <tr className="block md:table-row">
                  <td colSpan={4} className="block md:table-cell p-8 text-center text-slate-500 font-medium bg-slate-50">No hay usuarios en esta organización.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
