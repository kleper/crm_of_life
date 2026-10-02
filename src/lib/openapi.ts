export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "CRM de la Vida API",
    version: "1.0.0",
    description:
      "API REST completa para la gestión de tareas, subtareas, usuarios y categorías en CRM de la Vida. Todas las peticiones deben autenticarse mediante un Bearer Token (API Key) generado por el usuario desde la interfaz web.",
    contact: {
      name: "Soporte CRM de la Vida",
      url: "/docs/api",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Servidor API v1",
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    "/tasks": {
      get: {
        summary: "Listar tareas",
        description:
          "Recupera una lista de tareas de la organización activa con soporte para filtros por estado, categoría, responsable, vencimiento y búsqueda de texto.",
        operationId: "listTasks",
        parameters: [
          {
            name: "status",
            in: "query",
            description: "Filtrar por estado de la tarea",
            required: false,
            schema: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE"],
            },
          },
          {
            name: "categoryId",
            in: "query",
            description: "Filtrar por ID de categoría",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "assignedTo",
            in: "query",
            description: "Filtrar por ID de usuario asignado",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "overdue",
            in: "query",
            description: "Filtrar exclusivamente tareas cuya fecha límite ya venció",
            required: false,
            schema: { type: "boolean" },
          },
          {
            name: "dueDate",
            in: "query",
            description: "Filtrar por fecha límite exacta (formato YYYY-MM-DD)",
            required: false,
            schema: { type: "string", format: "date" },
          },
          {
            name: "search",
            in: "query",
            description: "Término de búsqueda en título y descripción",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            description: "Cantidad máxima de tareas a retornar (default: 50, máx: 100)",
            required: false,
            schema: { type: "integer", default: 50, maximum: 100 },
          },
          {
            name: "offset",
            in: "query",
            description: "Desplazamiento para paginación",
            required: false,
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": {
            description: "Lista de tareas obtenida exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Task" },
                    },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
      post: {
        summary: "Crear tarea",
        description:
          "Crea una nueva tarea dentro de la organización activa. Si se asigna a otro usuario, se enviará una notificación push e interna automáticamente.",
        operationId: "createTask",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTaskInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tarea creada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    task: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequestError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
    "/tasks/{id}": {
      get: {
        summary: "Obtener tarea por ID",
        description:
          "Devuelve la información detallada de una tarea específica, incluyendo sus subtareas, categoría y asignaciones.",
        operationId: "getTaskById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID único de la tarea",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Tarea encontrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    task: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
      patch: {
        summary: "Actualizar tarea",
        description:
          "Actualiza campos de la tarea. Si el estado cambia a 'DONE', calcula y añade los puntos de gamificación y actualiza la racha del usuario.",
        operationId: "updateTask",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la tarea a actualizar",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTaskInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tarea actualizada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    task: { $ref: "#/components/schemas/Task" },
                    gamification: {
                      $ref: "#/components/schemas/GamificationResult",
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequestError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
      delete: {
        summary: "Eliminar tarea",
        description: "Elimina de forma permanente una tarea y todas sus subtareas asociadas.",
        operationId: "deleteTask",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la tarea a eliminar",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Tarea eliminada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Tarea eliminada exitosamente." },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/tasks/{id}/subtasks": {
      post: {
        summary: "Añadir subtarea",
        description: "Agrega una nueva microtarea/checklist item a la tarea indicada.",
        operationId: "addSubtask",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la tarea padre",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSubtaskInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Subtarea creada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    subtask: { $ref: "#/components/schemas/Subtask" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequestError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/tasks/{id}/subtasks/{subtaskId}": {
      patch: {
        summary: "Actualizar o alternar subtarea",
        description: "Modifica el título, fecha límite o estado de completado de una subtarea.",
        operationId: "updateSubtask",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la tarea padre",
            schema: { type: "string" },
          },
          {
            name: "subtaskId",
            in: "path",
            required: true,
            description: "ID de la subtarea",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSubtaskInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Subtarea actualizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    subtask: { $ref: "#/components/schemas/Subtask" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
      delete: {
        summary: "Eliminar subtarea",
        description: "Elimina una subtarea específica.",
        operationId: "deleteSubtask",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la tarea padre",
            schema: { type: "string" },
          },
          {
            name: "subtaskId",
            in: "path",
            required: true,
            description: "ID de la subtarea a eliminar",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Subtarea eliminada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/users": {
      get: {
        summary: "Listar miembros del equipo",
        description:
          "Devuelve la lista de usuarios pertenecientes a la organización activa, útil para saber a quién asignar tareas.",
        operationId: "listUsers",
        responses: {
          "200": {
            description: "Lista de usuarios",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
    "/categories": {
      get: {
        summary: "Listar categorías de tareas",
        description:
          "Devuelve las categorías configuradas en la organización para clasificar tareas.",
        operationId: "listCategories",
        responses: {
          "200": {
            description: "Lista de categorías",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    categories: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "crol_live_...",
        description:
          "Clave de API personal generada desde la aplicación web en Configuración > Claves API.",
      },
    },
    schemas: {
      Task: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          points: { type: "integer", example: 10 },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
          dueDate: { type: "string", format: "date-time", nullable: true },
          dueTime: { type: "string", nullable: true, example: "14:30" },
          categoryId: { type: "string", nullable: true },
          assignedTo: { type: "string", nullable: true },
          createdByUserId: { type: "string", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          category: { $ref: "#/components/schemas/Category", nullable: true },
          assignee: { $ref: "#/components/schemas/User", nullable: true },
          subtasks: {
            type: "array",
            items: { $ref: "#/components/schemas/Subtask" },
          },
        },
      },
      CreateTaskInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Preparar presentación de producto" },
          description: { type: "string", example: "Diseñar diapositivas clave y métricas del Q3" },
          points: { type: "integer", default: 10, minimum: 1, maximum: 100 },
          dueDate: { type: "string", format: "date", example: "2026-10-15" },
          dueTime: { type: "string", example: "17:00" },
          categoryId: { type: "string", nullable: true },
          assignedTo: { type: "string", description: "ID del usuario responsable", nullable: true },
          subtasks: {
            type: "array",
            items: { type: "string" },
            example: ["Revisar cifras", "Exportar gráficos", "Enviar borrador"],
          },
        },
      },
      UpdateTaskInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string", nullable: true },
          points: { type: "integer", minimum: 1, maximum: 100 },
          dueDate: { type: "string", format: "date", nullable: true },
          dueTime: { type: "string", nullable: true },
          categoryId: { type: "string", nullable: true },
          assignedTo: { type: "string", nullable: true },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
        },
      },
      Subtask: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          completed: { type: "boolean" },
          dueDate: { type: "string", format: "date-time", nullable: true },
          order: { type: "integer" },
          assignedTo: { type: "string", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateSubtaskInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Enviar confirmación por email" },
          dueDate: { type: "string", format: "date", nullable: true },
        },
      },
      UpdateSubtaskInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          completed: { type: "boolean" },
          dueDate: { type: "string", format: "date", nullable: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          role: { type: "string", enum: ["TENANT_ADMIN", "USER"] },
          image: { type: "string", nullable: true },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          color: { type: "string", example: "#6366f1" },
        },
      },
      GamificationResult: {
        type: "object",
        properties: {
          pointsEarned: { type: "integer" },
          previousLevel: { type: "integer" },
          currentLevel: { type: "integer" },
          leveledUp: { type: "boolean" },
          streak: { type: "integer" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              status: { type: "integer" },
              details: { type: "object" },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Cabecera de autorización faltante, malformada o API key inválida.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      BadRequestError: {
        description: "Cuerpo de solicitud o parámetros inválidos.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFoundError: {
        description: "El recurso solicitado no existe o pertenece a otra organización.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
};
