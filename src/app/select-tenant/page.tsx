import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SelectTenantForm from "./SelectTenantForm"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function SelectTenantPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentTenantId = (session.user as any).selectedTenantId;
  if (currentTenantId) {
    redirect("/dashboard");
  }

  // Fetch fresh tenants directly from the DB to ensure any newly created tenants by SuperAdmins
  // or newly assigned tenants are accurately reflected.
  const userTenants = await prisma.tenantUser.findMany({
    where: { userId: session.user.id },
    include: { tenant: true }
  })

  const tenants = userTenants.map(tu => ({
    tenantId: tu.tenantId,
    name: tu.tenant.name,
    role: tu.role
  }))

  const isSuperAdmin = (session.user as any).isSuperAdmin

  // If no tenants, they need to contact admin
  if (tenants.length === 0 && !isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-8 border border-slate-200 shadow-sm rounded-none text-center">
          <h2 className="text-xl font-bold text-slate-900">Sin acceso a organizaciones</h2>
          <p className="text-slate-500 mt-4">Tu usuario no pertenece a ninguna organización. Contacta a un administrador.</p>
        </div>
      </div>
    )
  }

  // If they are Super Admin but have 0 tenants
  if (tenants.length === 0 && isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white p-8 border border-slate-200 shadow-sm rounded-none text-center">
          <h2 className="text-xl font-bold text-slate-900">Bienvenido Super Admin</h2>
          <p className="text-slate-500 mt-4">Aún no perteneces a ninguna organización. Ve al Panel de Administración para crear y asignar la primera.</p>
          <a href="/admin" className="mt-6 inline-block bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 transition-colors">
            Ir a Administración
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 border border-slate-200 shadow-sm rounded-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Selecciona una Organización</h1>
          <p className="text-slate-500 mt-2">Elige a qué entorno deseas acceder</p>
        </div>
        
        <SelectTenantForm tenants={tenants} currentTenantId={currentTenantId} />
      </div>
    </div>
  )
}
