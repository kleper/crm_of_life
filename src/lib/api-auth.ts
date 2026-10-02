import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export interface ApiAuthContext {
  userId: string;
  tenantId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  apiKeyId: string;
}

export type ApiAuthResult =
  | { success: true; context: ApiAuthContext }
  | { success: false; response: NextResponse };

/**
 * Generates a new secure API key with prefix and hash
 */
export function generateApiKey(): {
  plaintextKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const plaintextKey = `crol_live_${randomBytes}`;
  const keyPrefix = `crol_live_${randomBytes.slice(0, 6)}...${randomBytes.slice(-4)}`;
  const keyHash = hashApiKey(plaintextKey);

  return { plaintextKey, keyPrefix, keyHash };
}

/**
 * Calculates SHA-256 hash of an API key
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Standard API Error Response
 */
export function apiError(message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      error: {
        message,
        status,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Standard API Success Response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Validates Bearer token from Request Authorization header.
 * Enforces strict multi-tenant isolation by extracting tenantId from the validated API key.
 */
export async function authenticateApiKey(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader) {
    return {
      success: false,
      response: apiError(
        "Falta la cabecera 'Authorization'. Debes incluir 'Authorization: Bearer <API_KEY>'.",
        401
      ),
    };
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return {
      success: false,
      response: apiError(
        "Formato de cabecera inválido. Formato esperado: 'Authorization: Bearer <API_KEY>'.",
        401
      ),
    };
  }

  const token = parts[1];
  const keyHash = hashApiKey(token);

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!apiKey) {
      return {
        success: false,
        response: apiError("Clave API inválida o no reconocida.", 401),
      };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return {
        success: false,
        response: apiError("La clave API ha expirado. Por favor genera una nueva.", 401),
      };
    }

    // Fire-and-forget lastUsedAt update
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        console.error("Error updating lastUsedAt for apiKey:", err);
      });

    return {
      success: true,
      context: {
        userId: apiKey.userId,
        tenantId: apiKey.tenantId,
        user: apiKey.user,
        apiKeyId: apiKey.id,
      },
    };
  } catch (error) {
    console.error("Error authenticating API key:", error);
    return {
      success: false,
      response: apiError("Error interno durante la autenticación de la clave API.", 500),
    };
  }
}
