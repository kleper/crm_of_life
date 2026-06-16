import { auth } from "@/auth";
import NavigationClient from "./NavigationClient";
import { PrismaClient } from "@prisma/client";
import { ConnectionStatusBanner } from "../ConnectionStatusBanner";
import { getUnreadNotificationsCount } from "@/features/notifications/actions";
import NotificationSoundListener from "./NotificationSoundListener";
import { PushSubscriptionGuardian } from "../PushSubscriptionGuardian";
import { ToastContainer } from "../ui/ToastContainer";

const prisma = new PrismaClient();

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Si no hay sesión, renderiza normal (ej: login page)
  if (!session?.user) {
    return <>{children}</>;
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;
  const currentTenantRole = (session.user as any).selectedTenantRole;
  const currentTenantId = (session.user as any).selectedTenantId;
  const canManage = isSuperAdmin || currentTenantRole === "TENANT_ADMIN";
  const userName = session.user.name || "Usuario";
  const userId = session.user.id as string;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationSoundsEnabled: true }
  });
  const soundsEnabled = dbUser?.notificationSoundsEnabled ?? true;

  const userTenantsData = await prisma.tenantUser.findMany({
    where: { userId },
    include: { tenant: true },
  });

  const userTenants = userTenantsData.map(tu => ({
    tenantId: tu.tenantId,
    name: tu.tenant.name,
    role: tu.role,
  }));

  const unreadCount = await getUnreadNotificationsCount();

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 relative">
      <NavigationClient 
        canManage={canManage} 
        userName={userName} 
        userTenants={userTenants}
        activeTenantId={currentTenantId}
        isSuperAdmin={isSuperAdmin}
        unreadCount={unreadCount}
      />
      
      <main className="flex-1 pb-16 md:pb-0 flex flex-col relative w-full min-w-0 overflow-x-hidden">
        <ConnectionStatusBanner />
        <NotificationSoundListener soundsEnabled={soundsEnabled} />
        <PushSubscriptionGuardian />
        <ToastContainer />
        {children}
      </main>
    </div>
  );
}
