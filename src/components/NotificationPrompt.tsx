"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { toast } from "@/lib/toast";

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribeToPush = async () => {
    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === "granted" && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;

        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          console.error("No VAPID public key available");
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        const res = await fetch("/api/web-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (res.ok) {
          toast.success("Notificaciones activadas correctamente");
        } else {
          console.error("Error al guardar suscripción push:", await res.text());
          toast.error("Error al activar notificaciones");
        }
        
        console.log("Push subscription successful.");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications", error);
    }
  };

  if (permission === "default") {
    return (
      <div className="bg-indigo-50 text-slate-900 p-4 flex flex-col sm:flex-row items-center justify-between rounded-none shadow-sm border border-indigo-200 border-l-4 border-l-indigo-500">
        <div className="mb-3 sm:mb-0">
          <h3 className="font-bold text-sm text-slate-900">Habilita las notificaciones</h3>
          <p className="text-xs text-slate-600">Recibe alertas sobre nuevas tareas y logros alcanzados.</p>
        </div>
        <Button onClick={subscribeToPush} variant="primary" className="whitespace-nowrap text-sm px-4 py-2">
          Habilitar
        </Button>
      </div>
    );
  }

  return null;
}

// Utility para convertir la VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
