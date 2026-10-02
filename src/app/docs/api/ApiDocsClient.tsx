"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Icons from "@/components/ui/Icons";

type CodeLang = "curl" | "javascript" | "python";
type DocSection = "rest" | "mcp" | "auth";

interface EndpointDef {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  category: "Tareas" | "Subtareas" | "Organización";
  summary: string;
  description: string;
  parameters?: Array<{ name: string; type: string; in: string; required?: boolean; description: string }>;
  requestBody?: string;
  responseExample: string;
  codeSnippets: {
    curl: string;
    javascript: string;
    python: string;
  };
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: "list-tasks",
    method: "GET",
    path: "/api/v1/tasks",
    category: "Tareas",
    summary: "Listar tareas con filtros",
    description: "Obtiene la lista de tareas de la organización activa con soporte para múltiples filtros.",
    parameters: [
      { name: "status", type: "string", in: "query", description: "TODO, IN_PROGRESS o DONE" },
      { name: "categoryId", type: "string", in: "query", description: "ID de la categoría" },
      { name: "assignedTo", type: "string", in: "query", description: "ID del usuario asignado" },
      { name: "overdue", type: "boolean", in: "query", description: "true para solo tareas vencidas" },
      { name: "dueDate", type: "string", in: "query", description: "Fecha límite exacta (YYYY-MM-DD)" },
      { name: "search", type: "string", in: "query", description: "Búsqueda en título o descripción" },
      { name: "limit", type: "integer", in: "query", description: "Máximo de resultados (default 50)" },
      { name: "offset", type: "integer", in: "query", description: "Paginación" },
    ],
    responseExample: `{
  "tasks": [
    {
      "id": "c1f7a8b2-...",
      "title": "Preparar informe mensual",
      "description": "Revisar métricas y objetivos",
      "points": 15,
      "status": "TODO",
      "dueDate": "2026-10-15T00:00:00.000Z",
      "dueTime": "16:00",
      "category": { "id": "cat-1", "name": "Trabajo", "color": "#6366f1" },
      "assignee": { "id": "usr-1", "name": "Ana Gómez", "email": "ana@crm.com" },
      "subtasks": [
        { "id": "st-1", "title": "Recopilar gráficos", "completed": false }
      ]
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}`,
    codeSnippets: {
      curl: `curl -X GET "https://tu-dominio.com/api/v1/tasks?status=TODO&limit=20" \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui"`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks?status=TODO", {
  headers: {
    "Authorization": "Bearer crol_live_tu_clave_aqui"
  }
});
const data = await res.json();
console.log(data.tasks);`,
      python: `import requests

url = "https://tu-dominio.com/api/v1/tasks"
headers = {"Authorization": "Bearer crol_live_tu_clave_aqui"}
params = {"status": "TODO", "limit": 20}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,
    },
  },
  {
    id: "create-task",
    method: "POST",
    path: "/api/v1/tasks",
    category: "Tareas",
    summary: "Crear una nueva tarea",
    description: "Crea una tarea en la organización. Si se asigna a otro usuario, dispara automáticamente una notificación push e interna.",
    requestBody: `{
  "title": "Diseñar wireframes",
  "description": "Flujo de onboarding de usuarios",
  "points": 10,
  "dueDate": "2026-10-20",
  "dueTime": "15:00",
  "categoryId": "cat-id-opcional",
  "assignedTo": "user-id-opcional",
  "subtasks": ["Pantalla 1", "Pantalla 2", "Exportar a Figma"]
}`,
    responseExample: `{
  "task": {
    "id": "t-8921a-...",
    "title": "Diseñar wireframes",
    "points": 10,
    "status": "TODO",
    "dueDate": "2026-10-20T00:00:00.000Z",
    "dueTime": "15:00",
    "subtasks": [
      { "id": "st-1", "title": "Pantalla 1", "completed": false }
    ],
    "createdAt": "2026-10-02T14:30:00.000Z"
  }
}`,
    codeSnippets: {
      curl: `curl -X POST "https://tu-dominio.com/api/v1/tasks" \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Diseñar wireframes",
    "points": 10,
    "dueDate": "2026-10-20",
    "subtasks": ["Pantalla 1", "Pantalla 2"]
  }'`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks", {
  method: "POST",
  headers: {
    "Authorization": "Bearer crol_live_tu_clave_aqui",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Diseñar wireframes",
    points: 10,
    dueDate: "2026-10-20",
    subtasks: ["Pantalla 1", "Pantalla 2"]
  })
});
const data = await res.json();
console.log(data.task);`,
      python: `import requests

url = "https://tu-dominio.com/api/v1/tasks"
headers = {
    "Authorization": "Bearer crol_live_tu_clave_aqui",
    "Content-Type": "application/json"
}
payload = {
    "title": "Diseñar wireframes",
    "points": 10,
    "dueDate": "2026-10-20",
    "subtasks": ["Pantalla 1", "Pantalla 2"]
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`,
    },
  },
  {
    id: "get-task",
    method: "GET",
    path: "/api/v1/tasks/{id}",
    category: "Tareas",
    summary: "Obtener tarea por ID",
    description: "Devuelve los detalles completos de una tarea, sus subtareas, categoría y asignado.",
    parameters: [{ name: "id", type: "string", in: "path", required: true, description: "ID de la tarea" }],
    responseExample: `{
  "task": {
    "id": "c1f7a8b2-...",
    "title": "Preparar informe",
    "status": "TODO",
    "points": 15,
    "category": { "name": "Finanzas" },
    "subtasks": []
  }
}`,
    codeSnippets: {
      curl: `curl -X GET "https://tu-dominio.com/api/v1/tasks/c1f7a8b2-..." \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui"`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-...", {
  headers: { "Authorization": "Bearer crol_live_tu_clave_aqui" }
});
const { task } = await res.json();`,
      python: `import requests
res = requests.get("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-...", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"})
print(res.json())`,
    },
  },
  {
    id: "update-task",
    method: "PATCH",
    path: "/api/v1/tasks/{id}",
    category: "Tareas",
    summary: "Actualizar tarea o marcar como completada",
    description: "Permite modificar datos de la tarea. Si se cambia el estado a 'DONE', calcula y añade los puntos de gamificación y racha.",
    parameters: [{ name: "id", type: "string", in: "path", required: true, description: "ID de la tarea" }],
    requestBody: `{
  "status": "DONE",
  "points": 20
}`,
    responseExample: `{
  "task": {
    "id": "c1f7a8b2-...",
    "title": "Preparar informe",
    "status": "DONE",
    "completedAt": "2026-10-02T14:35:00.000Z"
  },
  "gamification": {
    "pointsEarned": 20,
    "previousLevel": 3,
    "currentLevel": 3,
    "leveledUp": false,
    "streak": 5
  }
}`,
    codeSnippets: {
      curl: `curl -X PATCH "https://tu-dominio.com/api/v1/tasks/c1f7a8b2-..." \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "DONE"}'`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-...", {
  method: "PATCH",
  headers: {
    "Authorization": "Bearer crol_live_tu_clave_aqui",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ status: "DONE" })
});
const data = await res.json();`,
      python: `import requests
res = requests.patch("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-...", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"}, json={"status": "DONE"})
print(res.json())`,
    },
  },
  {
    id: "delete-task",
    method: "DELETE",
    path: "/api/v1/tasks/{id}",
    category: "Tareas",
    summary: "Eliminar una tarea",
    description: "Elimina permanentemente una tarea y todas sus subtareas.",
    parameters: [{ name: "id", type: "string", in: "path", required: true, description: "ID de la tarea" }],
    responseExample: `{
  "success": true,
  "message": "Tarea eliminada exitosamente."
}`,
    codeSnippets: {
      curl: `curl -X DELETE "https://tu-dominio.com/api/v1/tasks/c1f7a8b2-..." \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui"`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-...", {
  method: "DELETE",
  headers: { "Authorization": "Bearer crol_live_tu_clave_aqui" }
});`,
      python: `import requests
res = requests.delete("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-...", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"})`,
    },
  },
  {
    id: "create-subtask",
    method: "POST",
    path: "/api/v1/tasks/{id}/subtasks",
    category: "Subtareas",
    summary: "Añadir subtarea",
    description: "Agrega una nueva microtarea a la tarea indicada.",
    parameters: [{ name: "id", type: "string", in: "path", required: true, description: "ID de la tarea padre" }],
    requestBody: `{
  "title": "Llamar al cliente para validar alcance"
}`,
    responseExample: `{
  "subtask": {
    "id": "st-89...",
    "taskId": "c1f7a8b2-...",
    "title": "Llamar al cliente",
    "completed": false,
    "order": 1
  }
}`,
    codeSnippets: {
      curl: `curl -X POST "https://tu-dominio.com/api/v1/tasks/c1f7a8b2-.../subtasks" \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Validar alcance"}'`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-.../subtasks", {
  method: "POST",
  headers: { "Authorization": "Bearer crol_live_tu_clave_aqui", "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Validar alcance" })
});`,
      python: `import requests
res = requests.post("https://tu-dominio.com/api/v1/tasks/c1f7a8b2-.../subtasks", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"}, json={"title": "Validar alcance"})`,
    },
  },
  {
    id: "update-subtask",
    method: "PATCH",
    path: "/api/v1/tasks/{id}/subtasks/{subtaskId}",
    category: "Subtareas",
    summary: "Alternar o editar subtarea",
    description: "Modifica el título o marca la subtarea como completada.",
    parameters: [
      { name: "id", type: "string", in: "path", required: true, description: "ID de la tarea padre" },
      { name: "subtaskId", type: "string", in: "path", required: true, description: "ID de la subtarea" },
    ],
    requestBody: `{
  "completed": true
}`,
    responseExample: `{
  "subtask": {
    "id": "st-89...",
    "completed": true,
    "completedAt": "2026-10-02T14:36:00.000Z"
  }
}`,
    codeSnippets: {
      curl: `curl -X PATCH "https://tu-dominio.com/api/v1/tasks/c1f.../subtasks/st-89..." \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{"completed": true}'`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/tasks/c1f.../subtasks/st-89...", {
  method: "PATCH",
  headers: { "Authorization": "Bearer crol_live_tu_clave_aqui", "Content-Type": "application/json" },
  body: JSON.stringify({ completed: true })
});`,
      python: `import requests
res = requests.patch("https://tu-dominio.com/api/v1/tasks/c1f.../subtasks/st-89...", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"}, json={"completed": True})`,
    },
  },
  {
    id: "list-users",
    method: "GET",
    path: "/api/v1/users",
    category: "Organización",
    summary: "Listar miembros del equipo",
    description: "Devuelve los usuarios pertenecientes al tenant activo con sus respectivos roles y correos.",
    responseExample: `{
  "users": [
    { "id": "usr-1", "name": "Ana Gómez", "email": "ana@crm.com", "role": "TENANT_ADMIN" },
    { "id": "usr-2", "name": "Carlos Pérez", "email": "carlos@crm.com", "role": "USER" }
  ]
}`,
    codeSnippets: {
      curl: `curl -X GET "https://tu-dominio.com/api/v1/users" \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui"`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/users", {
  headers: { "Authorization": "Bearer crol_live_tu_clave_aqui" }
});
const { users } = await res.json();`,
      python: `import requests
res = requests.get("https://tu-dominio.com/api/v1/users", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"})
print(res.json())`,
    },
  },
  {
    id: "list-categories",
    method: "GET",
    path: "/api/v1/categories",
    category: "Organización",
    summary: "Listar categorías",
    description: "Obtiene las categorías disponibles para clasificar tareas en la organización.",
    responseExample: `{
  "categories": [
    { "id": "cat-1", "name": "Trabajo", "color": "#6366f1" },
    { "id": "cat-2", "name": "Personal", "color": "#10b981" }
  ]
}`,
    codeSnippets: {
      curl: `curl -X GET "https://tu-dominio.com/api/v1/categories" \\
  -H "Authorization: Bearer crol_live_tu_clave_aqui"`,
      javascript: `const res = await fetch("https://tu-dominio.com/api/v1/categories", {
  headers: { "Authorization": "Bearer crol_live_tu_clave_aqui" }
});
const { categories } = await res.json();`,
      python: `import requests
res = requests.get("https://tu-dominio.com/api/v1/categories", headers={"Authorization": "Bearer crol_live_tu_clave_aqui"})`,
    },
  },
];

export default function ApiDocsClient() {
  const [activeSection, setActiveSection] = useState<DocSection>("rest");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeLangs, setActiveLangs] = useState<Record<string, CodeLang>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getLangForEndpoint = (endpointId: string): CodeLang => {
    return activeLangs[endpointId] || "curl";
  };

  const setLangForEndpoint = (endpointId: string, lang: CodeLang) => {
    setActiveLangs((prev) => ({ ...prev, [endpointId]: lang }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEndpoints =
    selectedCategory === "ALL"
      ? ENDPOINTS
      : ENDPOINTS.filter((e) => e.category === selectedCategory);

  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case "GET":
        return "info";
      case "POST":
        return "success";
      case "PATCH":
        return "warning";
      case "DELETE":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Header Banner */}
      <div className="bg-slate-50 border border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 border border-indigo-200">
              OpenAPI 3.1
            </span>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 border border-amber-200">
              MCP HTTP Read-Only
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 mt-2">
            Portal de Integración y Desarrolladores
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Conecta tus tareas con aplicaciones personalizadas, flujos automatizados en Zapier/N8N, o
            directamente con asistentes de IA mediante Model Context Protocol.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href="/settings/api"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Icons.Key className="w-4 h-4" /> Mis Claves API
          </Link>
          <a
            href="/api/v1/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Icons.ExternalLink className="w-4 h-4" /> openapi.json
          </a>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-100 p-1 gap-1">
        <button
          onClick={() => setActiveSection("rest")}
          className={`flex-1 py-2.5 px-3 min-h-[44px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            activeSection === "rest"
              ? "bg-white text-slate-900 border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icons.Code className="w-4 h-4" /> Endpoints REST (OpenAPI)
        </button>
        <button
          onClick={() => setActiveSection("mcp")}
          className={`flex-1 py-2.5 px-3 min-h-[44px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            activeSection === "mcp"
              ? "bg-white text-slate-900 border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icons.Cpu className="w-4 h-4" /> Servidor MCP HTTP
        </button>
        <button
          onClick={() => setActiveSection("auth")}
          className={`flex-1 py-2.5 px-3 min-h-[44px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            activeSection === "auth"
              ? "bg-white text-slate-900 border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icons.Lock className="w-4 h-4" /> Autenticación
        </button>
      </div>

      {/* TAB 1: REST Endpoints */}
      {activeSection === "rest" && (
        <div className="space-y-6">
          {/* Sub-filter by Category */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase px-2">Categoría:</span>
            {["ALL", "Tareas", "Subtareas", "Organización"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wide transition-colors ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat === "ALL" ? "Todos los Endpoints" : cat}
              </button>
            ))}
          </div>

          {/* Endpoints List */}
          <div className="space-y-6">
            {filteredEndpoints.map((ep) => {
              const currentLang = getLangForEndpoint(ep.id);
              const snippetText = ep.codeSnippets[currentLang];

              return (
                <div key={ep.id} className="bg-white border border-slate-200 divide-y divide-slate-200">
                  {/* Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={getMethodBadgeVariant(ep.method)} className="font-mono text-xs px-2.5 py-1">
                        {ep.method}
                      </Badge>
                      <span className="font-mono font-bold text-sm text-slate-900">{ep.path}</span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200">
                        {ep.category}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600">{ep.summary}</span>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 sm:p-6 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-600">{ep.description}</p>

                    {/* Parameters Table */}
                    {ep.parameters && ep.parameters.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Parámetros</h4>
                        <div className="overflow-x-auto border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                              <tr>
                                <th className="p-2.5 font-bold">Nombre</th>
                                <th className="p-2.5 font-bold">Tipo</th>
                                <th className="p-2.5 font-bold">Ubicación</th>
                                <th className="p-2.5 font-bold">Descripción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {ep.parameters.map((p) => (
                                <tr key={p.name} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-mono font-bold text-slate-900">
                                    {p.name} {p.required && <span className="text-red-500">*</span>}
                                  </td>
                                  <td className="p-2.5 text-slate-600">{p.type}</td>
                                  <td className="p-2.5 text-slate-500">{p.in}</td>
                                  <td className="p-2.5 text-slate-700">{p.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Request Body Example if present */}
                    {ep.requestBody && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                          Cuerpo de la Solicitud (JSON)
                        </h4>
                        <pre className="bg-slate-100 border border-slate-300 text-slate-800 font-mono text-xs p-3 overflow-x-auto select-all">
                          {ep.requestBody}
                        </pre>
                      </div>
                    )}

                    {/* Code Snippets Box with Language Selector */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex gap-1">
                          {(["curl", "javascript", "python"] as CodeLang[]).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setLangForEndpoint(ep.id, lang)}
                              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] ${
                                currentLang === lang
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-600 hover:text-slate-900 bg-slate-100"
                              }`}
                            >
                              {lang === "javascript" ? "JavaScript" : lang === "python" ? "Python" : "cURL"}
                            </button>
                          ))}
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => copyToClipboard(snippetText, `${ep.id}-${currentLang}`)}
                          className="min-h-[44px] text-xs font-bold uppercase tracking-wider"
                        >
                          {copiedId === `${ep.id}-${currentLang}` ? "¡Copiado!" : "Copiar Código"}
                        </Button>
                      </div>
                      <pre className="bg-slate-100 border border-slate-300 text-slate-800 font-mono text-xs p-4 overflow-x-auto leading-relaxed select-all">
                        {snippetText}
                      </pre>
                    </div>

                    {/* Response Schema / Example */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                        Respuesta Exitosa (200 OK / 201 Created)
                      </h4>
                      <pre className="bg-slate-100 border border-slate-300 text-slate-800 font-mono text-xs p-3 overflow-x-auto select-all">
                        {ep.responseExample}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MCP HTTP Server */}
      {activeSection === "mcp" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                MCP
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Servidor Model Context Protocol (MCP) HTTP
                </h3>
                <p className="text-xs text-slate-500">Protocol Version 2024-11-05 • Transporte HTTP JSON-RPC 2.0</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              El CRM incluye un servidor <strong>MCP HTTP</strong> nativo que permite a agentes de IA como Claude
              Desktop, Cursor, Windsurf o agentes autónomos consultar en tiempo real tus tareas, subtareas, usuarios y
              métricas de productividad. Por diseño y seguridad, este servidor opera en modo <strong>estrictamente de sólo lectura (Read-Only)</strong>.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">URL del Endpoint</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white border border-slate-300 p-2.5 font-mono text-indigo-700 font-bold flex-1 select-all">
                  https://tu-dominio.com/mcp
                </code>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard("https://tu-dominio.com/mcp", "mcp-url")}
                  className="min-h-[44px] text-xs font-bold"
                >
                  {copiedId === "mcp-url" ? "¡Copiado!" : "Copiar URL"}
                </Button>
              </div>
            </div>
          </div>

          {/* Claude Desktop Configuration Example */}
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Configuración en Claude Desktop o Clientes MCP
            </h3>
            <p className="text-xs text-slate-600">
              Agrega la siguiente configuración a tu archivo <code>claude_desktop_config.json</code> para conectar
              Claude con tu CRM:
            </p>
            <pre className="bg-slate-100 border border-slate-300 text-slate-800 font-mono text-xs p-4 overflow-x-auto select-all">
{`{
  "mcpServers": {
    "crm_of_life": {
      "url": "https://tu-dominio.com/mcp",
      "headers": {
        "Authorization": "Bearer crol_live_tu_clave_aqui"
      }
    }
  }
}`}
            </pre>
          </div>

          {/* Tools Catalog */}
          <div className="bg-white border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Herramientas MCP Disponibles (5 Herramientas Read-Only)
              </h3>
            </div>
            <div className="divide-y divide-slate-200">
              {[
                {
                  name: "list_tasks",
                  desc: "Consulta tareas con filtros de estado (TODO, IN_PROGRESS, DONE), búsqueda por texto, categoría o solo tareas vencidas.",
                  args: "status?: string, search?: string, categoryId?: string, overdueOnly?: boolean, limit?: number",
                },
                {
                  name: "get_task",
                  desc: "Obtiene información detallada de una tarea por su ID, incluyendo descripción, checklist de subtareas, categoría y responsable.",
                  args: "taskId: string (obligatorio)",
                },
                {
                  name: "list_categories",
                  desc: "Lista las categorías de tareas disponibles en la organización para clasificar el trabajo.",
                  args: "Sin argumentos requeridos",
                },
                {
                  name: "list_team_members",
                  desc: "Devuelve los miembros y colaboradores de la organización activa con sus respectivos roles.",
                  args: "Sin argumentos requeridos",
                },
                {
                  name: "get_productivity_summary",
                  desc: "Muestra el nivel de gamificación, racha de días activos, puntos acumulados y conteo de tareas pendientes y vencidas.",
                  args: "Sin argumentos requeridos",
                },
              ].map((t) => (
                <div key={t.name} className="p-4 sm:p-5 space-y-1 hover:bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-700">{t.name}</span>
                    <Badge variant="success" className="text-xs">Sólo Lectura</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{t.desc}</p>
                  <p className="text-xs font-mono text-slate-500 pt-1">
                    <strong>Parámetros:</strong> {t.args}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Authentication & Security */}
      {activeSection === "auth" && (
        <div className="bg-white border border-slate-200 p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Autenticación mediante Bearer Tokens
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Todas las llamadas a la API REST (<code>/api/v1/*</code>) y al servidor MCP (<code>/mcp</code>) requieren
              que envíes tu token de acceso en la cabecera estándar HTTP <code>Authorization</code>:
            </p>
          </div>

          <div className="p-4 bg-slate-100 border border-slate-300 font-mono text-xs text-slate-800 select-all">
            Authorization: Bearer crol_live_4a8b...
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Principios de Seguridad y Aislamiento Multi-Tenant
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
              <li>
                <strong>Aislamiento estricto por Organización:</strong> Cada clave de API está ligada al entorno de
                trabajo activo en el momento de su creación. No es posible acceder a datos de otro tenant con la misma clave.
              </li>
              <li>
                <strong>Almacenamiento seguro por Hash SHA-256:</strong> Tu clave en texto plano nunca se guarda en la
                base de datos. Solo se almacena su huella criptográfica.
              </li>
              <li>
                <strong>Revocación instantánea:</strong> Si sospechas que tu clave ha sido comprometida, puedes revocarla
                en un clic desde el panel de <Link href="/settings/api" className="text-indigo-600 font-bold underline">Claves API</Link> y el acceso cesará de inmediato.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
