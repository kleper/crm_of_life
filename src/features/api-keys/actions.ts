"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function getApiKeys() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado");
  }

  const currentTenantId = (session.user as any).selectedTenantId;
  const userId = session.user.id as string;

  if (!currentTenantId) {
    return [];
  }

  const keys = await prisma.apiKey.findMany({
    where: {
      tenantId: currentTenantId,
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return keys;
}

export async function createApiKeyAction(name: string, expiresDays?: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado");
  }

  const currentTenantId = (session.user as any).selectedTenantId;
  const userId = session.user.id as string;

  if (!currentTenantId) {
    throw new Error("No hay una organización activa seleccionada");
  }

  const trimmedName = (name || "").trim();
  if (!trimmedName) {
    throw new Error("El nombre de la clave es requerido");
  }

  if (trimmedName.length > 80) {
    throw new Error("El nombre no puede superar 80 caracteres");
  }

  const { plaintextKey, keyPrefix, keyHash } = generateApiKey();

  let expiresAt: Date | null = null;
  if (expiresDays && expiresDays > 0) {
    expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
  }

  const newKey = await prisma.apiKey.create({
    data: {
      name: trimmedName,
      keyPrefix,
      keyHash,
      userId,
      tenantId: currentTenantId,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  });

  revalidatePath("/settings/api");

  return {
    success: true,
    plaintextKey,
    key: newKey,
  };
}

export async function revokeApiKeyAction(keyId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado");
  }

  const currentTenantId = (session.user as any).selectedTenantId;
  const userId = session.user.id as string;

  if (!currentTenantId) {
    throw new Error("No hay una organización activa seleccionada");
  }

  // Multi-tenant check: Verify ownership before deletion
  const existing = await prisma.apiKey.findFirst({
    where: {
      id: keyId,
      tenantId: currentTenantId,
      userId: userId,
    },
  });

  if (!existing) {
    throw new Error("Clave API no encontrada");
  }

  await prisma.apiKey.delete({
    where: { id: keyId },
  });

  revalidatePath("/settings/api");

  return { success: true };
}
