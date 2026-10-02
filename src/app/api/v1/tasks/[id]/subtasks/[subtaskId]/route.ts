import { authenticateApiKey, apiError, apiSuccess } from "@/lib/api-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RouteContext {
  params: Promise<{ id: string; subtaskId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId, userId } = authRes.context;
  const { id, subtaskId } = await params;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!task) {
      return apiError("Tarea no encontrada en la organización.", 404);
    }

    const existingSubtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId: id },
    });

    if (!existingSubtask) {
      return apiError("Subtarea no encontrada en la tarea especificada.", 404);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError("El cuerpo de la petición debe ser un JSON válido.", 400);
    }

    const { title, completed, dueDate } = body;
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return apiError("El título no puede estar vacío.", 400);
      }
      updateData.title = title.trim();
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        updateData.dueDate = null;
      } else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) {
          return apiError("Formato de fecha 'dueDate' inválido.", 400);
        }
        updateData.dueDate = d;
      }
    }

    if (completed !== undefined) {
      const isCompleted = Boolean(completed);
      updateData.completed = isCompleted;
      if (isCompleted && !existingSubtask.completed) {
        updateData.completedAt = new Date();
        updateData.completedByUserId = userId;
      } else if (!isCompleted && existingSubtask.completed) {
        updateData.completedAt = null;
        updateData.completedByUserId = null;
      }
    }

    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData,
    });

    return apiSuccess({ subtask: updatedSubtask });
  } catch (error) {
    console.error("Error updating subtask via API:", error);
    return apiError("Error interno al actualizar la subtarea.", 500);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;
  const { id, subtaskId } = await params;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!task) {
      return apiError("Tarea no encontrada en la organización.", 404);
    }

    const existingSubtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId: id },
    });

    if (!existingSubtask) {
      return apiError("Subtarea no encontrada.", 404);
    }

    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    return apiSuccess({
      success: true,
      message: "Subtarea eliminada exitosamente.",
    });
  } catch (error) {
    console.error("Error deleting subtask via API:", error);
    return apiError("Error interno al eliminar la subtarea.", 500);
  }
}
