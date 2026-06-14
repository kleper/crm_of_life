"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { updateOrganizationGeneralSettings } from "@/features/settings/general/actions";
import { formatCurrency } from "@/lib/currency";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type CountryOption = {
  code: string;
  name: string;
  defaultCurrency: string;
  timezones: string[];
};

type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

type GeneralSettingsClientProps = {
  tenant: {
    id: string;
    name: string;
    country: string | null;
    timezone: string;
    currency: string;
  };
  countryOptions: CountryOption[];
  currencyOptions: CurrencyOption[];
};

export default function GeneralSettingsClient({ tenant, countryOptions, currencyOptions }: GeneralSettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedCountry, setSelectedCountry] = useState(tenant.country || "");
  const [selectedCurrency, setSelectedCurrency] = useState(tenant.currency || "USD");
  const [selectedTimezone, setSelectedTimezone] = useState(tenant.timezone || "America/Bogota");
  
  const [confirmDialogData, setConfirmDialogData] = useState<{ isOpen: boolean; transactionCount: number } | null>(null);

  const activeCountry = countryOptions.find(c => c.code === selectedCountry);
  const timezonesForCountry = activeCountry?.timezones || [];

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setSelectedCountry(newCountryCode);

    const newCountry = countryOptions.find(c => c.code === newCountryCode);
    if (newCountry) {
      if (newCountry.timezones.length > 0) {
        setSelectedTimezone(newCountry.timezones[0]);
      }
      if (newCountry.defaultCurrency) {
        setSelectedCurrency(newCountry.defaultCurrency);
      }
    }
  };

  const handleSave = (confirmed = false) => {
    startTransition(async () => {
      try {
        const res = await updateOrganizationGeneralSettings({
          country: selectedCountry,
          timezone: selectedTimezone,
          currency: selectedCurrency,
          confirmed
        });

        if (res.requiresConfirmation) {
          setConfirmDialogData({ isOpen: true, transactionCount: res.transactionCount });
          return;
        }

        toastSuccess("Configuración guardada exitosamente");
        setConfirmDialogData(null);
      } catch (err: any) {
        toastError(err.message || "Error al guardar");
      }
    });
  };

  const toastSuccess = (msg: string) => alert(msg);
  const toastError = (msg: string) => alert(msg);

  const formattedExample = formatCurrency(1234567.89, selectedCurrency);

  return (
    <>
      {!tenant.country && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-none text-sm font-medium">
          ⚠ Configura el país de tu organización para ajustar automáticamente la zona horaria y moneda.
        </div>
      )}

      <Card>
        <div className="p-6 space-y-6">
          
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-none text-sm text-slate-600 mb-4">
            <h4 className="font-bold text-slate-800 mb-1">Acerca de la Configuración General</h4>
            <p>La <strong>zona horaria</strong> afecta: generación de tareas recurrentes y recordatorios.</p>
            <p>La <strong>moneda</strong> afecta: formato de montos en Finanzas y Dashboard.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">País</label>
            <Select 
              value={selectedCountry} 
              onChange={handleCountryChange} 
              className="max-w-md"
              options={[
                { value: "", label: "Seleccione un país" },
                ...countryOptions.map(c => ({ value: c.code, label: c.name }))
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Zona Horaria</label>
            <Select 
              value={selectedTimezone} 
              onChange={(e) => setSelectedTimezone(e.target.value)} 
              className="max-w-md"
              disabled={timezonesForCountry.length <= 1}
              options={
                timezonesForCountry.length > 0 
                  ? timezonesForCountry.map(tz => ({ value: tz, label: tz }))
                  : [{ value: selectedTimezone, label: selectedTimezone }]
              }
            />
            {timezonesForCountry.length <= 1 && (
              <p className="text-xs text-slate-500">Automática según el país</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Moneda (Finanzas)</label>
            <Select 
              value={selectedCurrency} 
              onChange={(e) => setSelectedCurrency(e.target.value)} 
              className="max-w-md"
              options={currencyOptions.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
            />
            <p className="text-xs font-medium text-slate-600 mt-2 bg-slate-50 inline-block px-2 py-1 border border-slate-200 rounded-none">
              Ejemplo de formato: {formattedExample}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <Button onClick={() => handleSave(false)} disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={!!confirmDialogData}
        title="Confirmar Cambio de Moneda"
        message={`Tienes ${confirmDialogData?.transactionCount || 0} transacciones registradas. Cambiar la moneda NO convertirá los montos existentes, solo cambiará el símbolo visual. ¿Deseas continuar?`}
        confirmText="Sí, Cambiar Moneda"
        cancelText="Cancelar"
        onConfirm={() => handleSave(true)}
        onCancel={() => setConfirmDialogData(null)}
        variant="warning"
      />
    </>
  );
}
