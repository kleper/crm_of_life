"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getKudoOptions, KudoMetadata } from "@/lib/kudos";
import { sendKudo } from "@/features/kudos/actions";
import { KudoType } from "@prisma/client";

interface SendKudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantUsers: any[]; // User data
  currentUserId: string;
  defaultRecipientId?: string;
  relatedTaskId?: string;
  relatedSubtaskId?: string;
  onSuccess?: () => void;
}

export default function SendKudoModal({
  isOpen,
  onClose,
  tenantUsers,
  currentUserId,
  defaultRecipientId,
  relatedTaskId,
  relatedSubtaskId,
  onSuccess
}: SendKudoModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState(defaultRecipientId || "");
  const [selectedType, setSelectedType] = useState<KudoType | null>(null);
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const kudoOptions = getKudoOptions();
  const selectableUsers = tenantUsers.filter(u => u.userId !== currentUserId);

  const handleSend = () => {
    if (!selectedUserId || !selectedType) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await sendKudo({
          toUserId: selectedUserId,
          type: selectedType,
          message,
          isPublic,
          relatedTaskId,
          relatedSubtaskId
        });

        if (result.error) {
          if (result.error === "DAILY_LIMIT_REACHED") {
            setError("Has alcanzado tu límite diario de 3 reconocimientos. ¡Vuelve mañana!");
          } else if (result.error === "ALREADY_ACKNOWLEDGED") {
            setError("Ya has reconocido a este usuario por esta tarea.");
          } else {
            setError("Error al enviar el reconocimiento.");
          }
          return;
        }

        // Reset and close
        setSelectedUserId("");
        setSelectedType(null);
        setMessage("");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || "Ocurrió un error.");
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar Reconocimiento 🏆">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Destinatario
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full border border-slate-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            disabled={isPending}
          >
            <option value="">Selecciona un miembro del equipo</option>
            {selectableUsers.map(u => (
              <option key={u.userId} value={u.userId}>
                {u.user.name || u.user.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Medalla
          </label>
          <div className="grid grid-cols-4 gap-2">
            {kudoOptions.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedType(opt.type)}
                className={`flex flex-col items-center justify-center p-2 border transition-all ${
                  selectedType === opt.type 
                    ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                disabled={isPending}
              >
                <span className="text-2xl mb-1">{opt.icon}</span>
                <span className="text-[10px] text-center leading-tight font-medium text-slate-600">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mensaje (Opcional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe unas palabras de agradecimiento..."
            className="w-full border border-slate-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
            maxLength={280}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isPublic" 
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded-none border-slate-300 text-indigo-600 focus:ring-indigo-500"
            disabled={isPending}
          />
          <label htmlFor="isPublic" className="text-sm text-slate-600">
            Compartir en el muro del equipo
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isPending || !selectedUserId || !selectedType}>
            {isPending ? "Enviando..." : "Enviar Kudo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
