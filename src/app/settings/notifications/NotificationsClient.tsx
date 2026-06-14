"use client";

import { useState, useTransition, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { toggleNotificationSounds } from "@/features/notifications/actions";

type Props = {
  initialSoundsEnabled: boolean;
  activeSubscriptionsCount: number;
};

export default function NotificationsClient({ initialSoundsEnabled, activeSubscriptionsCount }: Props) {
  const [soundsEnabled, setSoundsEnabled] = useState(initialSoundsEnabled);
  const [isPending, startTransition] = useTransition();
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleToggleSound = () => {
    const newValue = !soundsEnabled;
    setSoundsEnabled(newValue);
    startTransition(async () => {
      try {
        await toggleNotificationSounds(newValue);
      } catch (e) {
        console.error("Failed to toggle sounds", e);
        // Revert UI if failed
        setSoundsEnabled(!newValue);
      }
    });
  };

  return (
    <Card>
      <div className="p-6 space-y-8">
        {/* Sección de Permisos de Navegador */}
        <div className="space-y-4 border-b border-slate-200 pb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Alertas en el Dispositivo (Push)</h3>
            <p className="text-sm text-slate-500 mt-1">Configura las notificaciones que recibes en tu pantalla, incluso si la app está cerrada.</p>
          </div>
          
          <div className="bg-slate-50 p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Estado del Navegador:{" "}
                <span className={`font-bold ${permission === "granted" ? "text-emerald-600" : permission === "denied" ? "text-red-600" : "text-amber-600"}`}>
                  {permission === "granted" ? "Permitido" : permission === "denied" ? "Bloqueado" : "Pendiente"}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Suscripciones activas registradas: <span className="font-bold">{activeSubscriptionsCount}</span>
              </p>
            </div>
            
            <div>
              {permission === "default" && <NotificationPrompt />}
              {permission === "granted" && (
                <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 border border-emerald-200 inline-block">
                  ✓ Recibiendo alertas correctamente
                </div>
              )}
              {permission === "denied" && (
                <div className="text-xs text-red-600 font-medium bg-red-50 px-3 py-1 border border-red-200 inline-block">
                  ✕ Debes habilitar las notificaciones en la configuración de tu navegador
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Preferencias de Sonido */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sonidos de Notificación</h3>
            <p className="text-sm text-slate-500 mt-1">Habilita o deshabilita los sonidos al recibir alertas, Kudos o subir de nivel.</p>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-800">Sonidos en la Aplicación</p>
              <p className="text-xs text-slate-500">Reproducir efectos de sonido en eventos importantes.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                soundsEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={soundsEnabled}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </div>
    </Card>
  );
}
