import { authenticateApiKey, apiError, apiSuccess } from "@/lib/api-auth";
import { PrismaClient, TaskStatus } from "@prisma/client";
import { sendPushToUser } from "@/lib/push";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId } = authRes.context;
  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get("status") as TaskStatus | null;
  const categoryId = searchParams.get("categoryId");
  const assignedTo = searchParams.get("assignedTo");
  const overdueParam = searchParams.get("overdue") === "true";
  const dueDateParam = searchParams.get("dueDate");
  const search = searchParams.get("search")?.trim();

  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50", 10)), 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  const where: any = {
    tenantId,
  };

  if (statusParam && Object.values(TaskStatus).includes(statusParam)) {
    where.status = statusParam;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  if (overdueParam) {
    where.dueDate = { lt: new Date() };
    where.status = { not: TaskStatus.DONE };
  } else if (dueDateParam) {
    const startOfDay = new Date(`${dueDateParam}T00:00:00.000Z`);
    const endOfDay = new Date(`${dueDateParam}T23:59:59.999Z`);
    if (!isNaN(startOfDay.getTime())) {
      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return apiSuccess({
      tasks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing tasks via API:", error);
    return apiError("Error interno al obtener las tareas.", 500);
  }
}

export async function POST(request: Request) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) return authRes.response;

  const { tenantId, userId, user } = authRes.context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError("El cuerpo de la petición debe ser un JSON válido.", 400);
  }

  const { title, description, points, dueDate, dueTime, categoryId, assignedTo, subtasks } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return apiError("El campo 'title' es obligatorio.", 400);
  }

  // Validate category if provided
  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });
    if (!category) {
      return apiError("La categoría especificada no existe en la organización.", 400);
    }
  }

  // Validate assignedTo if provided
  let effectiveAssignedTo = userId;
  if (assignedTo && assignedTo !== userId) {
    const member = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: assignedTo,
        },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!member) {
      return apiError("El usuario asignado no pertenece a esta organización.", 400);
    }
    effectiveAssignedTo = assignedTo;
  }

  const taskPoints = typeof points === "number" ? Math.max(1, Math.min(100, points)) : 10;
  let parsedDueDate: Date | null = null;
  if (dueDate) {
    parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return apiError("Formato de fecha 'dueDate' inválido. Usa formato ISO (YYYY-MM-DD).", 400);
    }
  }

  try {
    const subtaskCreateData =
      Array.isArray(subtasks) && subtasks.length > 0
        ? subtasks
            .filter((st) => typeof st === "string" && st.trim().length > 0)
            .map((st: string, idx: number) => ({
              title: st.trim(),
              order: idx,
            }))
        : [];

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        points: taskPoints,
        dueDate: parsedDueDate,
        dueTime: dueTime || null,
        categoryId: categoryId || null,
        assignedTo: effectiveAssignedTo,
        createdByUserId: userId,
        tenantId,
        subtasks: subtaskCreateData.length > 0 ? { create: subtaskCreateData } : undefined,
      },
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

    // Notify if assigned to another team member
    if (effectiveAssignedTo && effectiveAssignedTo !== userId) {
      try {
        const creatorName = user.name || "Un miembro del equipo";
        await prisma.notification.create({
          data: {
            userId: effectiveAssignedTo,
            organizationId: tenantId,
            type: "TASK_DUE_SOON",
            title: "📌 Nueva Tarea Asignada",
            body: `${creatorName} te asignó la tarea: "${task.title}".`,
            link: "/tasks",
            read: false,
          },
        });

        await sendPushToUser(effectiveAssignedTo, {
          title: "📌 Nueva Tarea Asignada",
          body: `${creatorName} te asignó: "${task.title}".`,
          url: "/tasks",
        });
      } catch (notifErr) {
        console.error("Error dispatching notification for API task assignment:", notifErr);
      }
    }

    return apiSuccess({ task }, 201);
  } catch (error) {
    console.error("Error creating task via API:", error);
    return apiError("Error interno al crear la tarea.", 500);
  }
}
