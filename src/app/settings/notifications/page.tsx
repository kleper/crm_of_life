import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import NotificationsClient from "./NotificationsClient";

const prisma = new PrismaClient();

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationSoundsEnabled: true }
  });

  const pushSubscriptions = await prisma.pushSubscription.count({
    where: { userId }
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notificaciones</h1>
        <p className="text-slate-500 mt-1">Configura cómo y cuándo quieres recibir alertas.</p>
      </div>
      
      <NotificationsClient 
        initialSoundsEnabled={user?.notificationSoundsEnabled ?? true} 
        activeSubscriptionsCount={pushSubscriptions} 
      />
    </div>
  );
}
