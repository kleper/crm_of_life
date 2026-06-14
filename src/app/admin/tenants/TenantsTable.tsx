"use client"

import { useState } from "react"
import { updateTenantAction, deleteTenantAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/Button"

export default function TenantsTable({
  tenants
}: {
  tenants: { id: string; name: string; createdAt: Date }[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const startEditing = (tenant: { id: string; name: string }) => {
    setEditingId(tenant.id)
    setEditName(tenant.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveEditing = async (id: string) => {
    try {
      await updateTenantAction(id, editName)
      setEditingId(null)
    } catch (e) {
      console.error(e)
      alert("Error al actualizar la organización")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta organización? Esto eliminará también los usuarios asignados a ella.")) {
      try {
        await deleteTenantAction(id)
      } catch (e) {
        console.error(e)
        alert("Error al eliminar la organización")
      }
    }
  }

  return (
    <div className="bg-white border border-amber-200 shadow-sm rounded-none overflow-hidden">
      <table className="w-full text-left border-collapse block md:table">
        <thead className="hidden md:table-header-group">
          <tr className="bg-amber-100 border-b border-amber-200">
            <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs">Nombre</th>
            <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs">Fecha de Creación</th>
            <th className="p-4 font-black text-amber-900 uppercase tracking-wider text-xs md:text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {tenants.map((tenant, idx) => (
            <tr key={tenant.id} className={`block md:table-row border-b border-slate-200 md:border-slate-100 transition-colors hover:bg-amber-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} p-4 md:p-0`}>
              <td className="flex md:table-cell justify-between items-center md:p-4 text-slate-700 font-bold mb-2 md:mb-0">
                <span className="md:hidden text-xs font-black text-amber-900 uppercase tracking-wider">Nombre</span>
                {editingId === tenant.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-amber-300 p-2 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white shadow-inner"
                  />
                ) : (
                  tenant.name
                )}
              </td>
              <td className="flex md:table-cell justify-between items-center md:p-4 text-slate-500 font-medium mb-4 md:mb-0">
                <span className="md:hidden text-xs font-black text-amber-900 uppercase tracking-wider">Fecha</span>
                {new Date(tenant.createdAt).toLocaleDateString()}
              </td>
              <td className="block md:table-cell md:p-4 md:text-right border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                {editingId === tenant.id ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={cancelEditing}
                      variant="secondary"
                      className="px-4 py-1.5 text-xs border-slate-300 w-1/2 md:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => saveEditing(tenant.id)}
                      variant="primary"
                      className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white w-1/2 md:w-auto"
                    >
                      Guardar
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => startEditing(tenant)}
                      variant="secondary"
                      className="px-4 py-1.5 text-xs border-slate-300 w-1/2 md:w-auto"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(tenant.id)}
                      variant="destructive"
                      className="px-4 py-1.5 text-xs w-1/2 md:w-auto"
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {tenants.length === 0 && (
            <tr className="block md:table-row">
              <td colSpan={3} className="block md:table-cell p-8 text-center text-slate-500 font-medium bg-slate-50">No hay organizaciones creadas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
