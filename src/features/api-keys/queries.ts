import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export async function getApiKeysQuery(userId: string, tenantId: string): Promise<ApiKeyItem[]> {
  if (!userId || !tenantId) {
    return [];
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: {
        tenantId,
        userId,
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

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      createdAt: k.createdAt instanceof Date ? k.createdAt.toISOString() : String(k.createdAt),
      lastUsedAt: k.lastUsedAt ? (k.lastUsedAt instanceof Date ? k.lastUsedAt.toISOString() : String(k.lastUsedAt)) : null,
      expiresAt: k.expiresAt ? (k.expiresAt instanceof Date ? k.expiresAt.toISOString() : String(k.expiresAt)) : null,
    }));
  } catch (error) {
    console.error("[getApiKeysQuery] Failed to fetch API keys (table may not exist yet):", error);
    return [];
  }
}
