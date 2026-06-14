"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getUnreadNotificationsCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;
  
  const organizationId = (session.user as any).selectedTenantId;
  if (!organizationId) return 0;

  return prisma.notification.count({
    where: {
      userId: session.user.id,
      organizationId,
      read: false
    }
  });
}

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  const organizationId = (session.user as any).selectedTenantId;
  if (!organizationId) return [];

  return prisma.notification.findMany({
    where: {
      userId: session.user.id,
      organizationId
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  
  const organizationId = (session.user as any).selectedTenantId;
  if (!organizationId) return;

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
      organizationId
    },
    data: { read: true }
  });

  revalidatePath("/notifications");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  
  const organizationId = (session.user as any).selectedTenantId;
  if (!organizationId) return;

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      organizationId,
      read: false
    },
    data: { read: true }
  });

  revalidatePath("/notifications");
}
