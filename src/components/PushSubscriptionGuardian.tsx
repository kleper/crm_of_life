"use client";

import { useEffect, useState } from "react";

export function PushSubscriptionGuardian() {
  const [needsInteraction, setNeedsInteraction] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
      }

      if (Notification.permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            console.log("Push permission is granted but subscription is missing (possible iOS purge). Attempting silent resubscription...");
            
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) return;
            
            try {
              // Attempt silent resubscription
              const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
              });
              
              await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSubscription),
              });
              console.log("Silent resubscription successful.");
            } catch (err: any) {
              console.error("Silent resubscription failed (user gesture likely required):", err);
              // Require user interaction
              setNeedsInteraction(true);
            }
          }
        } catch (error) {
          console.error("Error checking push subscription status", error);
        }
      }
    }

    checkSubscription();
  }, []);

  const handleManualResubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) return;

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubscription),
      });
      console.log("Manual resubscription successful.");
      setNeedsInteraction(false);
    } catch (err) {
      console.error("Manual resubscription failed:", err);
    }
  };

  if (!needsInteraction) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between rounded-none gap-4 max-w-sm border-l-4 border-l-yellow-600">
      <div className="flex flex-col">
        <h3 className="font-bold text-sm">Conexión de notificaciones interrumpida</h3>
        <p className="text-xs mt-1">Para seguir recibiendo alertas en tu dispositivo, haz clic en Reconectar.</p>
      </div>
      <button 
        onClick={handleManualResubscribe} 
        className="bg-yellow-600 text-white hover:bg-yellow-700 whitespace-nowrap text-sm px-4 py-2 font-medium transition-colors"
      >
        Reconectar
      </button>
    </div>
  );
}

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
