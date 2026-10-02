import { authenticateApiKey, apiError, apiSuccess } from "@/lib/api-auth";
import { PrismaClient, TaskStatus } from "@prisma/client";
import { calculateLevel } from "@/lib/gamification";
import { sendPushToUser } from "@/lib/push";

const prisma = new PrismaClient();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;
  const { id } = await params;

  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        collaborators: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!task) {
      return apiError("Tarea no encontrada en la organización.", 404);
    }

    return apiSuccess({ task });
  } catch (error) {
    console.error("Error retrieving task via API:", error);
    return apiError("Error interno al obtener la tarea.", 500);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId, userId, user } = authRes.context;
  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError("El cuerpo de la petición debe ser un JSON válido.", 400);
  }

  try {
    const existingTask = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return apiError("Tarea no encontrada en la organización.", 404);
    }

    const {
      title,
      description,
      points,
      dueDate,
      dueTime,
      categoryId,
      assignedTo,
      status,
    } = body;

    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return apiError("El título no puede estar vacío.", 400);
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (points !== undefined) {
      if (typeof points !== "number" || points < 1 || points > 100) {
        return apiError("Los puntos deben ser un número entre 1 y 100.", 400);
      }
      updateData.points = points;
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

    if (dueTime !== undefined) {
      updateData.dueTime = dueTime || null;
    }

    if (categoryId !== undefined) {
      if (categoryId) {
        const cat = await prisma.category.findFirst({
          where: { id: categoryId, tenantId },
        });
        if (!cat) {
          return apiError("La categoría especificada no existe en la organización.", 400);
        }
        updateData.categoryId = categoryId;
      } else {
        updateData.categoryId = null;
      }
    }

    let reassigned = false;
    if (assignedTo !== undefined) {
      if (assignedTo) {
        const member = await prisma.tenantUser.findUnique({
          where: { tenantId_userId: { tenantId, userId: assignedTo } },
        });
        if (!member) {
          return apiError("El usuario asignado no pertenece a la organización.", 400);
        }
        updateData.assignedTo = assignedTo;
        if (assignedTo !== existingTask.assignedTo && assignedTo !== userId) {
          reassigned = true;
        }
      } else {
        updateData.assignedTo = null;
      }
    }

    let gamificationResult: any = null;

    if (status !== undefined) {
      if (!Object.values(TaskStatus).includes(status)) {
        return apiError("Estado inválido. Opciones: TODO, IN_PROGRESS, DONE.", 400);
      }
      updateData.status = status;

      // When marking as DONE
      if (status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE) {
        updateData.completedAt = new Date();

        // Award gamification points to the assignee or the actor
        const targetUserId = existingTask.assignedTo || userId;
        try {
          let userStats = await prisma.userStats.findUnique({
            where: { userId_tenantId: { userId: targetUserId, tenantId } },
          });

          if (!userStats) {
            userStats = await prisma.userStats.create({
              data: { userId: targetUserId, tenantId },
            });
          }

          const pointsToAdd = updateData.points || existingTask.points;
          const prevTotal = userStats.totalPoints;
          const newTotal = prevTotal + pointsToAdd;
          const prevLevel = userStats.currentLevel;
          const newLevel = calculateLevel(newTotal);

          // Update streak
          const today = new Date();
          let newStreak = userStats.currentStreak;
          if (userStats.lastCompletionDate) {
            const last = new Date(userStats.lastCompletionDate);
            const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 3600 * 24));
            if (diffDays === 1) {
              newStreak += 1;
            } else if (diffDays > 1) {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          await prisma.userStats.update({
            where: { userId_tenantId: { userId: targetUserId, tenantId } },
            data: {
              totalPoints: newTotal,
              currentLevel: newLevel,
              currentStreak: newStreak,
              lastCompletionDate: today,
            },
          });

          gamificationResult = {
            pointsEarned: pointsToAdd,
            previousLevel: prevLevel,
            currentLevel: newLevel,
            leveledUp: newLevel > prevLevel,
            streak: newStreak,
          };
        } catch (gError) {
          console.error("Error updating gamification in API:", gError);
        }
      } else if (status !== TaskStatus.DONE && existingTask.status === TaskStatus.DONE) {
        updateData.completedAt = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    // Notify if reassigned
    if (reassigned && updateData.assignedTo) {
      try {
        const creatorName = user.name || "Un miembro del equipo";
        await prisma.notification.create({
          data: {
            userId: updateData.assignedTo,
            organizationId: tenantId,
            type: "TASK_DUE_SOON",
            title: "📌 Nueva Tarea Asignada",
            body: `${creatorName} te asignó la tarea: "${updatedTask.title}".`,
            link: "/tasks",
            read: false,
          },
        });

        await sendPushToUser(updateData.assignedTo, {
          title: "📌 Nueva Tarea Asignada",
          body: `${creatorName} te asignó: "${updatedTask.title}".`,
          url: "/tasks",
        });
      } catch (err) {
        console.error("Error notifying task reassignment via API:", err);
      }
    }

    return apiSuccess({
      task: updatedTask,
      ...(gamificationResult ? { gamification: gamificationResult } : {}),
    });
  } catch (error) {
    console.error("Error updating task via API:", error);
    return apiError("Error interno al actualizar la tarea.", 500);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;
  const { id } = await params;

  try {
    const existing = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return apiError("Tarea no encontrada en la organización.", 404);
    }

    await prisma.task.delete({
      where: { id },
    });

    return apiSuccess({
      success: true,
      message: "Tarea eliminada exitosamente.",
    });
  } catch (error) {
    console.error("Error deleting task via API:", error);
    return apiError("Error interno al eliminar la tarea.", 500);
  }
}
