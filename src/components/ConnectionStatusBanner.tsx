"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState } from "react";
import { getPendingMutations, updateMutationStatus, deleteMutation } from "@/lib/idb";
import { createTask } from "@/features/tasks/actions";
import { logInteraction as logInteractionAction } from "@/features/contacts/actions";
import { useRouter } from "next/navigation";

export function ConnectionStatusBanner() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const checkPending = async () => {
    const mutations = await getPendingMutations();
    const pending = mutations.filter(m => m.status === 'pending' || m.status === 'failed');
    setPendingCount(pending.length);
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      syncMutations();
    }
  }, [isOnline, pendingCount]);

  const syncMutations = async () => {
    setSyncing(true);
    try {
      const mutations = await getPendingMutations();
      const pending = mutations.filter(m => m.status === 'pending' || m.status === 'failed');
      
      for (const m of pending) {
        if (!m.id) continue;
        await updateMutationStatus(m.id, 'syncing');
        
        try {
          if (m.type === 'CREATE_TASK') {
            await createTask(m.payload);
          } else if (m.type === 'LOG_INTERACTION') {
            await logInteractionAction(m.payload.contactId, m.payload.data);
          }
          await deleteMutation(m.id);
        } catch (e) {
          console.error("Failed to sync mutation", m);
          await updateMutationStatus(m.id, 'failed', m.retryCount + 1);
        }
      }
      
      await checkPending();
      router.refresh(); // Refresh RSC payloads to get updated data
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`w-full py-2 px-4 text-center text-xs font-bold uppercase tracking-wider z-50 ${isOnline ? 'bg-indigo-100 text-indigo-800 border-b border-indigo-200' : 'bg-amber-100 text-amber-900 border-b border-amber-300'}`}>
      {!isOnline && (
        <span className="flex items-center justify-center gap-2">
          <span>📡</span> Sin conexión — los cambios se guardarán y sincronizarán automáticamente.
        </span>
      )}
      {isOnline && pendingCount > 0 && (
        <span className="flex items-center justify-center gap-2">
          {syncing ? 'Sincronizando ' : 'Pendiente: '} {pendingCount} cambios...
          {!syncing && (
            <button onClick={syncMutations} className="underline ml-2 hover:text-indigo-900">
              Sincronizar ahora
            </button>
          )}
        </span>
      )}
    </div>
  );
}
