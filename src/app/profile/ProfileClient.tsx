"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateNotificationPreferences } from "./actions";

interface ProfileClientProps {
  initialName: string;
  initialEmail: string;
  initialSoundsEnabled: boolean;
}

export default function ProfileClient({ initialName, initialEmail, initialSoundsEnabled }: ProfileClientProps) {
  const [soundsEnabled, setSoundsEnabled] = useState(initialSoundsEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggleSounds = () => {
    const newVal = !soundsEnabled;
    setSoundsEnabled(newVal);
    startTransition(async () => {
      await updateNotificationPreferences(newVal);
    });
  };

  const handleTestSound = (type: "default" | "kudo") => {
    // We send a message to ourselves to trigger the listener
    window.postMessage({ type: "PLAY_NOTIFICATION_SOUND", soundType: type }, "*");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card noPadding className="bg-white">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Datos Personales</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
            <div className="text-sm font-medium text-slate-900">{initialName}</div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico</label>
            <div className="text-sm font-medium text-slate-900">{initialEmail}</div>
          </div>
        </div>
      </Card>

      <Card noPadding className="bg-white">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Preferencias de Notificación</h3>
        </div>
        <div className="p-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Sonidos in-app</div>
              <div className="text-xs text-slate-500 mt-1">
                Reproducir sonidos cuando lleguen notificaciones y reconocimientos (requiere interacción previa en la pestaña).
              </div>
            </div>
            <button 
              type="button"
              disabled={isPending}
              onClick={handleToggleSounds}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-none border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${soundsEnabled ? 'bg-indigo-600' : 'bg-slate-200'} ${isPending ? 'opacity-50' : ''}`}
              role="switch"
              aria-checked={soundsEnabled}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-none bg-white shadow ring-0 transition duration-200 ease-in-out ${soundsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {soundsEnabled && (
            <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Probar sonidos</span>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => handleTestSound("default")}>
                  🔔 Notificación Normal
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTestSound("kudo")}>
                  🏆 Reconocimiento (Kudo)
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-8">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Créditos de Audio</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Los sonidos de la aplicación son sintetizados en tiempo real utilizando la <strong>Web Audio API</strong> nativa de tu navegador. 
          No se utilizan archivos de audio externos para garantizar tiempos de carga nulos y cumplimiento estricto con licencias CC0.
        </p>
      </div>
    </div>
  );
}
