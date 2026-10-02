import { authenticateApiKey, apiError, apiSuccess } from "@/lib/api-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;
  const { id } = await params;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId },
      include: { subtasks: { select: { id: true } } },
    });

    if (!task) {
      return apiError("Tarea no encontrada en la organización.", 404);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError("El cuerpo de la petición debe ser un JSON válido.", 400);
    }

    const { title, dueDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return apiError("El campo 'title' de la subtarea es obligatorio.", 400);
    }

    let parsedDueDate: Date | null = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return apiError("Formato de fecha 'dueDate' inválido.", 400);
      }
    }

    const subtask = await prisma.subtask.create({
      data: {
        taskId: id,
        title: title.trim(),
        dueDate: parsedDueDate,
        order: task.subtasks.length,
      },
    });

    return apiSuccess({ subtask }, 201);
  } catch (error) {
    console.error("Error creating subtask via API:", error);
    return apiError("Error interno al crear la subtarea.", 500);
  }
}
