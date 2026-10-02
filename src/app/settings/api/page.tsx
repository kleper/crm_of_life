import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getApiKeys } from "@/features/api-keys/actions";
import { ApiKeysManager } from "@/features/api-keys/components/ApiKeysManager";

export const metadata = {
  title: "Claves API e Integraciones | CRM de la Vida",
  description: "Administra tus claves de API personales para conectar aplicaciones y clientes MCP.",
};

export default async function ApiSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const keys = await getApiKeys();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Claves API e Integraciones"
        description="Genera y administra tokens de acceso Bearer para automatizaciones, scripts y clientes MCP (Model Context Protocol)."
      />

      <ApiKeysManager initialKeys={keys} />
    </div>
  );
}
