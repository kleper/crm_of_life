import { authenticateApiKey, apiError, apiSuccess } from "@/lib/api-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;

  try {
    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess({ categories });
  } catch (error) {
    console.error("Error listing categories via API:", error);
    return apiError("Error interno al obtener las categorías.", 500);
  }
}
