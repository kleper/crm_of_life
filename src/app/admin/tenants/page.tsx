import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import CreateTenantForm from "./CreateTenantForm";
import TenantsTable from "./TenantsTable";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const prisma = new PrismaClient();

export default async function TenantsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;
  if (!isSuperAdmin) {
    redirect("/admin");
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="flex flex-col flex-1 p-6 h-full bg-amber-50">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="bg-amber-100 border border-amber-300 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Warning Stripes Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 10px, transparent 10px, transparent 20px)' }}></div>
          
          <div className="relative z-10 flex flex-col items-start gap-2">
            <h1 className="text-2xl font-black text-amber-900 tracking-tight uppercase">Organizaciones</h1>
            <p className="text-sm text-amber-800 font-bold">Gestión global de inquilinos en la plataforma.</p>
          </div>
          <div className="relative z-10 flex gap-4 items-center">
            <Link href="/admin">
              <Button variant="secondary" className="border-amber-400 text-amber-900 hover:bg-amber-200">
                &larr; Volver
              </Button>
            </Link>
          </div>
        </div>

        <CreateTenantForm />

        <div className="mt-8">
          <TenantsTable tenants={tenants} />
        </div>
      </div>
    </main>
  );
}
