"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getQueue, clearQueue } from "@/lib/offlineQueue";

export function OfflineSyncProvider() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Definimos estado inicial
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      const queue = await getQueue();
      
      if (queue.length > 0) {
        setIsSyncing(true);
        try {
          const response = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queue }),
          });

          if (response.ok) {
            await clearQueue();
            router.refresh();
          } else {
            console.error("Error sincronizando cola offline");
          }
        } catch (error) {
          console.error("Fallo de red durante la sincronización", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Intentar sincronizar al montar si hay algo en la cola y estamos online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  if (!isOnline || isSyncing) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-slate-900 text-white text-xs px-4 py-2 flex items-center gap-2 shadow-lg rounded-none">
        {!isOnline && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Estás Offline
          </>
        )}
        {isOnline && isSyncing && (
          <>
            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
            Sincronizando datos...
          </>
        )}
      </div>
    );
  }

  return null;
}
