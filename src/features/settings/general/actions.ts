"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import countries from "world-countries";
import { getTimezonesForCountry } from "countries-and-timezones";

const prisma = new PrismaClient();

export async function getCountryOptions() {
  return countries.map(c => {
    // Determine translation or fallback
    const name = c.translations?.spa?.common || c.name.common;
    const currencyCodes = Object.keys(c.currencies || {});
    const defaultCurrency = currencyCodes.length > 0 ? currencyCodes[0] : "USD";
    
    // Get timezones for this country
    const tzData = getTimezonesForCountry(c.cca2) || [];
    const timezones = tzData.map(t => t.name);

    return {
      code: c.cca2,
      name,
      defaultCurrency,
      timezones
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCurrencyOptions() {
  // Extract all unique currencies from world-countries to have a comprehensive list
  const currencyMap = new Map<string, { code: string, name: string, symbol: string }>();
  
  countries.forEach(c => {
    if (c.currencies) {
      Object.entries(c.currencies).forEach(([code, details]: [string, any]) => {
        if (!currencyMap.has(code)) {
          currencyMap.set(code, {
            code,
            name: details.name,
            symbol: details.symbol || code
          });
        }
      });
    }
  });

  return Array.from(currencyMap.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export async function getOrganizationGeneralSettings() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentTenantId = (session.user as any).selectedTenantId;
  if (!currentTenantId) throw new Error("No organization selected");

  const tenant = await prisma.tenant.findUnique({
    where: { id: currentTenantId },
    select: {
      id: true,
      name: true,
      country: true,
      timezone: true,
      currency: true
    }
  });

  return tenant;
}

export async function updateOrganizationGeneralSettings(data: {
  country?: string;
  timezone?: string;
  currency?: string;
  confirmed?: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentTenantId = (session.user as any).selectedTenantId;
  const currentTenantRole = (session.user as any).selectedTenantRole;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  if (!currentTenantId) throw new Error("No organization selected");

  if (!isSuperAdmin && currentTenantRole !== "TENANT_ADMIN") {
    throw new Error("Only admins can update general settings");
  }

  // Si cambia la moneda y no se ha confirmado, revisar transacciones
  if (data.currency && !data.confirmed) {
    const tenant = await prisma.tenant.findUnique({ where: { id: currentTenantId } });
    if (tenant && tenant.currency !== data.currency) {
      const transactionCount = await prisma.transaction.count({
        where: { organizationId: currentTenantId }
      });
      if (transactionCount > 0) {
        return { requiresConfirmation: true, transactionCount };
      }
    }
  }

  // Si envían country pero no timezone explícita, se intenta autocompletar la primera
  let finalTimezone = data.timezone;
  if (data.country && !data.timezone) {
    const tzData = getTimezonesForCountry(data.country);
    if (tzData && tzData.length > 0) {
      finalTimezone = tzData[0].name;
    }
  }

  const updateData: any = {};
  if (data.country !== undefined) updateData.country = data.country;
  if (finalTimezone !== undefined) updateData.timezone = finalTimezone;
  if (data.currency !== undefined) updateData.currency = data.currency;

  await prisma.tenant.update({
    where: { id: currentTenantId },
    data: updateData
  });

  revalidatePath("/settings/general");
  revalidatePath("/finance");
  revalidatePath("/dashboard");

  return { success: true };
}
