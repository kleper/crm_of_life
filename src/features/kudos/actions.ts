"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { auth } from "@/auth";
import { KudoType } from "@prisma/client";
import { awardCollaborationPoints } from "@/lib/gamification";
import { sendPushToUser } from "@/lib/push";
import { getKudoOptions } from "@/lib/kudos";

const KUDOS_DAILY_LIMIT = 3;
const KUDOS_POINTS_REWARD = 5;

export async function sendKudo({
  toUserId,
  type,
  message,
  isPublic = true,
  relatedTaskId,
  relatedSubtaskId,
}: {
  toUserId: string;
  type: KudoType;
  message?: string;
  isPublic?: boolean;
  relatedTaskId?: string;
  relatedSubtaskId?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const currentUserId = session.user.id as string;
  const currentTenantId = (session.user as any).selectedTenantId;

  if (!currentTenantId) throw new Error("No hay organización seleccionada");
  if (currentUserId === toUserId) throw new Error("No puedes enviarte un Kudo a ti mismo");

  // Validate that recipient belongs to the same tenant
  const recipientMember = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: currentTenantId, userId: toUserId } }
  });

  if (!recipientMember) {
    throw new Error("El destinatario no pertenece a tu organización");
  }

  // Check Daily Limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sentTodayCount = await prisma.kudo.count({
    where: {
      organizationId: currentTenantId,
      fromUserId: currentUserId,
      createdAt: { gte: today }
    }
  });

  if (sentTodayCount >= KUDOS_DAILY_LIMIT) {
    return { error: "DAILY_LIMIT_REACHED" };
  }

  // Check for duplicates on the same resource
  if (relatedTaskId || relatedSubtaskId) {
    const existingKudo = await prisma.kudo.findFirst({
      where: {
        organizationId: currentTenantId,
        fromUserId: currentUserId,
        toUserId,
        OR: [
          relatedTaskId ? { relatedTaskId } : {},
          relatedSubtaskId ? { relatedSubtaskId } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });

    if (existingKudo) {
      return { error: "ALREADY_ACKNOWLEDGED" };
    }
  }

  // Create Kudo
  const kudo = await prisma.kudo.create({
    data: {
      organizationId: currentTenantId,
      fromUserId: currentUserId,
      toUserId,
      type,
      message,
      isPublic,
      relatedTaskId,
      relatedSubtaskId
    }
  });

  // Award Points
  await awardCollaborationPoints(toUserId, currentTenantId, KUDOS_POINTS_REWARD);

  // Send Notification
  await prisma.notification.create({
    data: {
      userId: toUserId,
      organizationId: currentTenantId,
      type: "KUDO_RECEIVED",
      title: "🏆 ¡Nuevo reconocimiento!",
      body: `Alguien de tu equipo te ha enviado un Kudo.`,
      link: `/kudos`
    }
  });

  const senderUser = await prisma.user.findUnique({ where: { id: currentUserId } });
  const senderName = senderUser?.name || "Un compañero";
  const options = getKudoOptions();
  const kudoMeta = options.find(o => o.type === type);
  const kudoLabel = kudoMeta ? kudoMeta.label : "Reconocimiento";

  await sendPushToUser(toUserId, {
    title: "🏆 ¡Nuevo reconocimiento!",
    body: `${senderName} te envió: ${kudoLabel} ${kudoMeta?.icon || ""}`,
    link: "/kudos",
    soundType: "kudo"
  });

  revalidatePath("/kudos");
  revalidatePath("/dashboard");
  if (relatedTaskId) revalidatePath("/tasks");

  return { success: true, kudo };
}

export async function getReceivedKudos(userId: string, tenantId: string) {
  return prisma.kudo.findMany({
    where: { organizationId: tenantId, toUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { name: true, image: true, email: true } }
    }
  });
}

export async function getSentKudos(userId: string, tenantId: string) {
  return prisma.kudo.findMany({
    where: { organizationId: tenantId, fromUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      toUser: { select: { name: true, image: true, email: true } }
    }
  });
}

export async function getKudoSummary(userId: string, tenantId: string) {
  const received = await prisma.kudo.groupBy({
    by: ["type"],
    where: { organizationId: tenantId, toUserId: userId },
    _count: { id: true }
  });

  const sentCount = await prisma.kudo.count({
    where: { organizationId: tenantId, fromUserId: userId }
  });

  return {
    received: received.reduce((acc, curr) => ({ ...acc, [curr.type]: curr._count.id }), {} as Record<string, number>),
    totalSent: sentCount
  };
}

export async function getPublicKudoWall(tenantId: string, limit: number = 10) {
  return prisma.kudo.findMany({
    where: { organizationId: tenantId, isPublic: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      fromUser: { select: { name: true, image: true, email: true } },
      toUser: { select: { name: true, image: true, email: true } }
    }
  });
}
