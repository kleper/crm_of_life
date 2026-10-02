import { authenticateApiKey, apiError, apiSuccess } from "@/lib/api-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;

  try {
    const tenantMembers = await prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const users = tenantMembers.map((tm) => ({
      id: tm.user.id,
      name: tm.user.name,
      email: tm.user.email,
      role: tm.role,
      image: tm.user.image,
    }));

    return apiSuccess({ users });
  } catch (error) {
    console.error("Error listing users via API:", error);
    return apiError("Error interno al obtener los usuarios.", 500);
  }
}
