import { PageHeader } from "@/components/ui/PageHeader";
import { getOrganizationGeneralSettings, getCountryOptions, getCurrencyOptions } from "@/features/settings/general/actions";
import GeneralSettingsClient from "./GeneralSettingsClient";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function GeneralSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).selectedTenantRole;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  if (role !== "TENANT_ADMIN" && !isSuperAdmin) {
    redirect("/dashboard");
  }

  const tenant = await getOrganizationGeneralSettings();
  if (!tenant) redirect("/dashboard");

  const countryOptions = await getCountryOptions();
  const currencyOptions = await getCurrencyOptions();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Configuración General"
        description="Ajusta el país, moneda y zona horaria de tu organización."
      />
      
      <GeneralSettingsClient 
        tenant={tenant}
        countryOptions={countryOptions}
        currencyOptions={currencyOptions}
      />
    </div>
  );
}
