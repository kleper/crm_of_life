"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Icons from "@/components/ui/Icons";

export default function ApiSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ApiSettingsError]", error);
  }, [error]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
          <Icons.AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            No se pudo cargar la configuración de API
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Ocurrió un error al consultar las claves de acceso de tu organización. Si acabas de actualizar la aplicación, verifica que las migraciones de base de datos se hayan aplicado en producción.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="min-h-[44px] text-xs font-bold uppercase tracking-wider"
          >
            Reintentar
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
