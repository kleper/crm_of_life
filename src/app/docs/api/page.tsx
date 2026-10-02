import { PageHeader } from "@/components/ui/PageHeader";
import ApiDocsClient from "./ApiDocsClient";

export const metadata = {
  title: "Documentación de la API | CRM de la Vida",
  description: "Especificación formal OpenAPI 3.1 y guía de conexión MCP HTTP para CRM de la Vida.",
};

export default function ApiDocsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Documentación de la API & MCP"
        description="Especificación OpenAPI 3.1 completa para la gestión de tareas, subtareas, usuarios y categorías. Integra tus aplicaciones o conecta tu asistente de IA mediante el servidor MCP HTTP."
      />

      <ApiDocsClient />
    </div>
  );
}
