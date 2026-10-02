"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Icons from "@/components/ui/Icons";
import { createApiKeyAction, revokeApiKeyAction } from "../actions";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date | string;
  lastUsedAt: Date | string | null;
  expiresAt: Date | string | null;
}

interface ApiKeysManagerProps {
  initialKeys: ApiKeyItem[];
}

export function ApiKeysManager({ initialKeys }: ApiKeysManagerProps) {
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [expiresDays, setExpiresDays] = useState<string>("0");

  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const days = parseInt(expiresDays, 10);
        const result = await createApiKeyAction(newKeyName.trim(), days > 0 ? days : undefined);
        if (result.success) {
          setKeys([result.key, ...keys]);
          setCreatedKey(result.plaintextKey);
          setIsCreateModalOpen(false);
          setNewKeyName("");
          setExpiresDays("0");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Error al crear la clave de API");
      }
    });
  };

  const handleRevokeKey = () => {
    if (!keyToRevoke) return;

    startTransition(async () => {
      try {
        await revokeApiKeyAction(keyToRevoke.id);
        setKeys(keys.filter((k) => k.id !== keyToRevoke.id));
        setKeyToRevoke(null);
      } catch (err: any) {
        alert(err.message || "Error al revocar la clave");
      }
    });
  };

  const handleCopyKey = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-slate-50 border border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Claves de Acceso Personal (Bearer Tokens)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Crea tokens seguros para conectar tus aplicaciones externas, scripts de automatización o tu
            asistente de IA preferido mediante el servidor <strong>MCP HTTP</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href="/docs/api"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Icons.BookOpen className="w-4 h-4" /> Ver Documentación API
          </Link>
          <Button
            variant="primary"
            onClick={() => {
              setErrorMessage(null);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-none min-h-[44px] uppercase tracking-wider text-xs font-bold"
          >
            + Nueva Clave API
          </Button>
        </div>
      </div>

      {/* Keys List */}
      <div className="bg-white border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Tus Claves Activas ({keys.length})
          </h3>
        </div>

        {keys.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Icons.Key className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No tienes claves API creadas</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Genera una clave para comenzar a integrar tus tareas con agentes autónomos o scripts personalizados.
            </p>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(true)}
              className="min-h-[44px] text-xs font-bold uppercase tracking-wider"
            >
              Crear mi primera clave
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {keys.map((k) => {
              const isExpired = k.expiresAt && new Date(k.expiresAt) < new Date();
              const createdDate = new Date(k.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const lastUsedStr = k.lastUsedAt
                ? new Date(k.lastUsedAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Nunca";

              return (
                <div
                  key={k.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{k.name}</span>
                      {isExpired ? (
                        <Badge variant="danger" className="text-xs">Expirada</Badge>
                      ) : (
                        <Badge variant="success" className="text-xs">Activa</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-slate-700">
                        {k.keyPrefix}
                      </span>
                      <span>Creada: {createdDate}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="hidden md:inline">Último uso: {lastUsedStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Button
                      variant="ghost"
                      onClick={() => setKeyToRevoke(k)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] px-3 font-bold"
                    >
                      Revocar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Integration Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
              REST
            </span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              API REST OpenAPI v3.1
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            CRUD completo de tareas, subtareas, usuarios y categorías con soporte para cURL, JavaScript y Python.
          </p>
          <div className="pt-2">
            <code className="text-xs bg-slate-50 border border-slate-200 p-2 block text-slate-800 font-mono truncate">
              GET /api/v1/tasks -H &quot;Authorization: Bearer &lt;TU_CLAVE&gt;&quot;
            </code>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs">
              MCP
            </span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Servidor MCP HTTP (Read-Only)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Conecta Claude Desktop, Cursor o Antigravity directamente a tu CRM vía HTTP JSON-RPC para consultar tareas y productividad.
          </p>
          <div className="pt-2">
            <code className="text-xs bg-slate-50 border border-slate-200 p-2 block text-slate-800 font-mono truncate">
              POST /mcp (JSON-RPC 2.0 con Bearer Token)
            </code>
          </div>
        </div>
      </div>

      {/* Modal: Create Key */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Clave API"
      >
        <form onSubmit={handleCreateKey} className="space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          <Input
            label="Nombre de la Clave"
            placeholder="Ej: Claude Desktop, N8N Automatización, Script Python"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Vigencia / Expiración
            </label>
            <select
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="w-full border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none rounded-none min-h-[44px]"
            >
              <option value="0">Sin expiración (Recomendado)</option>
              <option value="30">30 días</option>
              <option value="90">90 días</option>
              <option value="365">1 año (365 días)</option>
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Nota de seguridad:</strong> La clave operará con los mismos permisos de tu cuenta en esta organización. Podrás revocarla en cualquier momento.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !newKeyName.trim()}
              className="min-h-[44px] uppercase tracking-wider text-xs font-bold"
            >
              {isPending ? "Generando..." : "Crear Clave"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reveal Newly Created Key */}
      <Modal
        isOpen={Boolean(createdKey)}
        onClose={() => setCreatedKey(null)}
        title="¡Clave API Generada con Éxito!"
      >
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 border-2 border-amber-400 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Icons.AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Copia tu clave de API ahora
            </p>
            <p>
              Por razones de seguridad, <strong>no volverás a ver esta clave completa</strong>. Si la pierdes, tendrás que revocarla y generar una nueva.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Tu Clave Secreta
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdKey || ""}
                className="w-full bg-slate-50 border border-slate-300 p-3 font-mono text-xs sm:text-sm text-slate-900 select-all outline-none rounded-none"
              />
              <Button
                variant={isCopied ? "primary" : "secondary"}
                onClick={handleCopyKey}
                className="shrink-0 min-h-[44px] px-4 font-bold text-xs"
              >
                {isCopied ? "¡Copiada!" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <Button
              variant="primary"
              onClick={() => setCreatedKey(null)}
              className="min-h-[44px] uppercase tracking-wider text-xs font-bold"
            >
              Entendido, ya la guardé
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Revoke Dialog */}
      <ConfirmDialog
        isOpen={Boolean(keyToRevoke)}
        title="¿Revocar Clave API?"
        message={`¿Estás seguro de revocar la clave "${keyToRevoke?.name}" (${keyToRevoke?.keyPrefix})? Cualquier aplicación o cliente MCP que la use dejará de tener acceso inmediatamente.`}
        confirmText="Revocar Clave"
        cancelText="Conservar"
        variant="danger"
        onConfirm={handleRevokeKey}
        onCancel={() => setKeyToRevoke(null)}
      />
    </div>
  );
}
