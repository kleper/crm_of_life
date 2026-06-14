"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function SelectTenantForm({ tenants, currentTenantId }: { tenants: any[], currentTenantId: string | null }) {
  const { update } = useSession()
  const [loading, setLoading] = useState(false)

  const handleSelect = async (tenantId: string) => {
    setLoading(true)
    // Update the JWT session with the selected tenant
    await update({ tenantId })
    window.location.href = "/tasks"
  }

  if (loading) {
    return <div className="text-center text-gray-500">Cargando tu entorno...</div>
  }

  return (
    <div className="space-y-4">
      {tenants.map((t) => (
        <button
          key={t.tenantId}
          onClick={() => handleSelect(t.tenantId)}
          className={`w-full text-left p-4 border transition-colors rounded-none flex justify-between items-center ${
            currentTenantId === t.tenantId 
              ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" 
              : "border-gray-300 hover:border-blue-500 hover:bg-slate-50"
          }`}
        >
          <div>
            <span className="font-medium text-gray-900 block">{t.name || t.tenantId}</span>
            {currentTenantId === t.tenantId && (
              <span className="text-xs text-blue-600 mt-1 block">Organización actual</span>
            )}
          </div>
          <span className="text-xs bg-gray-100 px-2 py-1 text-gray-600 rounded-none border border-gray-200">
            {t.role}
          </span>
        </button>
      ))}
    </div>
  )
}
