import { authenticateApiKey } from "@/lib/api-auth";
import { PrismaClient, TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const READONLY_TOOLS = [
  {
    name: "list_tasks",
    description:
      "Lista tareas de la organización activa con filtros opcionales por estado, búsqueda de texto, categoría o solo tareas vencidas.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["TODO", "IN_PROGRESS", "DONE"],
          description: "Filtrar por estado de la tarea",
        },
        search: {
          type: "string",
          description: "Búsqueda en título o descripción",
        },
        categoryId: {
          type: "string",
          description: "ID de la categoría",
        },
        overdueOnly: {
          type: "boolean",
          description: "Si es true, solo devuelve tareas pendientes que ya vencieron",
        },
        limit: {
          type: "integer",
          description: "Máximo número de tareas a retornar (default: 20, max: 50)",
          default: 20,
        },
      },
    },
  },
  {
    name: "get_task",
    description:
      "Obtiene los detalles completos de una tarea por su ID, incluyendo descripción, subtareas, categoría y asignado.",
    inputSchema: {
      type: "object",
      required: ["taskId"],
      properties: {
        taskId: {
          type: "string",
          description: "ID de la tarea a inspeccionar",
        },
      },
    },
  },
  {
    name: "list_categories",
    description: "Lista las categorías de tareas disponibles en la organización.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_team_members",
    description: "Lista los miembros del equipo y usuarios en la organización activa.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_productivity_summary",
    description:
      "Devuelve un resumen de productividad del usuario en el tenant actual: nivel, racha, puntos totales y conteo de tareas pendientes y vencidas.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

function jsonRpcResponse(id: any, result: any) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      result,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

function jsonRpcError(id: any, code: number, message: string, status = 200) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

export async function GET(request: Request) {
  // Discovery / info endpoint
  return NextResponse.json(
    {
      name: "CRM de la Vida MCP Server",
      protocol: "mcp/http",
      version: "1.0.0",
      mode: "read-only",
      description:
        "Servidor MCP HTTP de sólo lectura para CRM de la Vida. Para interactuar, realiza peticiones POST JSON-RPC 2.0 con la cabecera 'Authorization: Bearer <API_KEY>'.",
      toolsCount: READONLY_TOOLS.length,
      availableTools: READONLY_TOOLS.map((t) => t.name),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function POST(request: Request) {
  const authRes = await authenticateApiKey(request);
  if (!authRes.success) {
    return jsonRpcError(
      null,
      -32000,
      "No autorizado. Cabecera 'Authorization: Bearer <API_KEY>' requerida o inválida.",
      401
    );
  }

  const { tenantId, userId, user } = authRes.context;

  let rpcBody: any;
  try {
    rpcBody = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error: JSON inválido.", 400);
  }

  const { jsonrpc, id, method, params } = rpcBody;

  if (jsonrpc !== "2.0") {
    return jsonRpcError(id, -32600, "Invalid Request: Se requiere jsonrpc 2.0.");
  }

  // --- MCP Method: initialize ---
  if (method === "initialize") {
    return jsonRpcResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: "crm-of-life-mcp",
        version: "1.0.0",
      },
    });
  }

  // --- MCP Method: notifications/initialized ---
  if (method === "notifications/initialized") {
    return jsonRpcResponse(id, {});
  }

  // --- MCP Method: ping ---
  if (method === "ping") {
    return jsonRpcResponse(id, {});
  }

  // --- MCP Method: tools/list ---
  if (method === "tools/list") {
    return jsonRpcResponse(id, {
      tools: READONLY_TOOLS,
    });
  }

  // --- MCP Method: tools/call ---
  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};

    // Validate that the tool exists in our strictly read-only whitelist
    const isAllowed = READONLY_TOOLS.some((t) => t.name === toolName);
    if (!isAllowed) {
      return jsonRpcError(
        id,
        -32601,
        `Herramienta '${toolName}' no encontrada o no permitida. Este servidor MCP es estrictamente de SÓLO LECTURA.`
      );
    }

    try {
      let outputText = "";

      if (toolName === "list_tasks") {
        const where: any = { tenantId };

        if (args.status && Object.values(TaskStatus).includes(args.status)) {
          where.status = args.status;
        }

        if (args.categoryId) {
          where.categoryId = args.categoryId;
        }

        if (args.overdueOnly) {
          where.dueDate = { lt: new Date() };
          where.status = { not: TaskStatus.DONE };
        }

        if (args.search) {
          where.OR = [
            { title: { contains: String(args.search), mode: "insensitive" } },
            { description: { contains: String(args.search), mode: "insensitive" } },
          ];
        }

        const limit = Math.min(Math.max(1, parseInt(args.limit || "20", 10)), 50);

        const tasks = await prisma.task.findMany({
          where,
          include: {
            category: { select: { name: true, color: true } },
            assignee: { select: { id: true, name: true, email: true } },
            subtasks: { select: { id: true, title: true, completed: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        outputText = JSON.stringify(
          {
            count: tasks.length,
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              points: t.points,
              dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
              dueTime: t.dueTime,
              category: t.category?.name || "Sin categoría",
              assignee: t.assignee?.name || "Sin asignar",
              subtasksCount: t.subtasks.length,
              completedSubtasks: t.subtasks.filter((s) => s.completed).length,
            })),
          },
          null,
          2
        );
      } else if (toolName === "get_task") {
        const taskId = args.taskId;
        if (!taskId) {
          return jsonRpcError(id, -32602, "El parámetro 'taskId' es obligatorio.");
        }

        const task = await prisma.task.findFirst({
          where: { id: taskId, tenantId },
          include: {
            category: true,
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
            subtasks: { orderBy: { order: "asc" } },
          },
        });

        if (!task) {
          outputText = JSON.stringify({ error: "Tarea no encontrada en la organización." });
        } else {
          outputText = JSON.stringify(task, null, 2);
        }
      } else if (toolName === "list_categories") {
        const categories = await prisma.category.findMany({
          where: { tenantId },
          select: { id: true, name: true, color: true },
          orderBy: { name: "asc" },
        });

        outputText = JSON.stringify({ categories }, null, 2);
      } else if (toolName === "list_team_members") {
        const members = await prisma.tenantUser.findMany({
          where: { tenantId },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        });

        outputText = JSON.stringify(
          {
            members: members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              role: m.role,
            })),
          },
          null,
          2
        );
      } else if (toolName === "get_productivity_summary") {
        const [userStats, pendingCount, overdueCount, completedTodayCount] = await Promise.all([
          prisma.userStats.findUnique({
            where: { userId_tenantId: { userId, tenantId } },
          }),
          prisma.task.count({
            where: {
              tenantId,
              status: { not: TaskStatus.DONE },
              OR: [{ assignedTo: userId }, { createdByUserId: userId }],
            },
          }),
          prisma.task.count({
            where: {
              tenantId,
              dueDate: { lt: new Date() },
              status: { not: TaskStatus.DONE },
              OR: [{ assignedTo: userId }, { createdByUserId: userId }],
            },
          }),
          prisma.task.count({
            where: {
              tenantId,
              status: TaskStatus.DONE,
              completedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
              OR: [{ assignedTo: userId }, { createdByUserId: userId }],
            },
          }),
        ]);

        outputText = JSON.stringify(
          {
            user: { id: userId, name: user.name },
            stats: {
              currentLevel: userStats?.currentLevel || 1,
              currentStreak: userStats?.currentStreak || 0,
              totalPoints: userStats?.totalPoints || 0,
              tasksPending: pendingCount,
              tasksOverdue: overdueCount,
              tasksCompletedToday: completedTodayCount,
            },
          },
          null,
          2
        );
      }

      return jsonRpcResponse(id, {
        content: [
          {
            type: "text",
            text: outputText,
          },
        ],
      });
    } catch (toolError) {
      console.error("Error executing MCP tool:", toolError);
      return jsonRpcError(id, -32603, "Internal tool execution error.");
    }
  }

  return jsonRpcError(id, -32601, `Método '${method}' no soportado.`);
}
