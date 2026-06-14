"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { 
  createTaskCategory, updateTaskCategory, deleteTaskCategory,
  createFinanceCategory, updateFinanceCategory, deleteFinanceCategory,
  createContactCategory, updateContactCategory, deleteContactCategory
} from "@/features/settings/categories/actions";

export default function CategoriesClient({ taskCategories, financeCategories, contactCategories }: any) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Reassign Modal
  const [reassignData, setReassignData] = useState<any>(null); // { id, type, count, options }

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const data = {
        name: formData.get("name") as string,
        color: formData.get("color") as string,
      };

      if (activeTab === "tasks") {
        await createTaskCategory(data);
      } else if (activeTab === "contacts") {
        await createContactCategory(data);
      } else {
        const financeData = { ...data, type: formData.get("type") as "INGRESO" | "GASTO" };
        await createFinanceCategory(financeData);
      }
      setIsNewModalOpen(false);
    });
  };

  const handleUpdate = (formData: FormData) => {
    startTransition(async () => {
      const data = {
        name: formData.get("name") as string,
        color: formData.get("color") as string,
      };

      if (activeTab === "tasks") {
        await updateTaskCategory(editingCategory.id, data);
      } else if (activeTab === "contacts") {
        await updateContactCategory(editingCategory.id, data);
      } else {
        await updateFinanceCategory(editingCategory.id, data);
      }
      setEditingCategory(null);
    });
  };

  const handleDelete = (id: string, count: number, options: any[]) => {
    startTransition(async () => {
      let res: any;
      if (activeTab === "tasks") res = await deleteTaskCategory(id);
      else if (activeTab === "contacts") res = await deleteContactCategory(id);
      else res = await deleteFinanceCategory(id);

      if (res?.error === 'CATEGORY_IN_USE') {
        setReassignData({ id, type: activeTab, count: res.count, options: options.filter((o: any) => o.id !== id) });
      }
    });
  };

  const handleReassignAndDelete = (formData: FormData) => {
    startTransition(async () => {
      const reassignToId = formData.get("reassignToId") as string;
      if (activeTab === "tasks") await deleteTaskCategory(reassignData.id, reassignToId);
      else if (activeTab === "contacts") await deleteContactCategory(reassignData.id, reassignToId);
      else await deleteFinanceCategory(reassignData.id, reassignToId);
      
      setReassignData(null);
    });
  };

  const renderList = (categories: any[], typeLabel: string) => {
    return (
      <div className="flex flex-col gap-3 mt-6">
        {categories.map((c: any) => {
          const count = c._count.tasks ?? c._count.contacts ?? c._count.transactions ?? 0;
          return (
            <div key={c.id} className="flex items-center justify-between p-4 bg-white border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-none border border-slate-300" style={{ backgroundColor: c.color || '#e2e8f0' }}></div>
                <div>
                  <div className="font-bold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-500">{count} {typeLabel}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditingCategory(c)}>Editar</Button>
                <Button variant="ghost" onClick={() => handleDelete(c.id, count, categories)} className="text-red-600 hover:bg-red-50">Eliminar</Button>
              </div>
            </div>
          )
        })}
        {categories.length === 0 && (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300">
            No hay categorías creadas.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-end">
          <PageHeader title="Categorías" description="Personaliza las etiquetas de tu organización." />
          <Button variant="primary" onClick={() => setIsNewModalOpen(true)}>+ Nueva Categoría</Button>
        </div>

        <div className="flex border-b border-slate-200">
          <button className={`px-6 py-3 font-bold text-sm uppercase tracking-wider ${activeTab === 'tasks' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('tasks')}>Tareas</button>
          <button className={`px-6 py-3 font-bold text-sm uppercase tracking-wider ${activeTab === 'finance' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('finance')}>Finanzas</button>
          <button className={`px-6 py-3 font-bold text-sm uppercase tracking-wider ${activeTab === 'contacts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('contacts')}>Contactos</button>
        </div>

        {activeTab === 'tasks' && renderList(taskCategories, "tareas")}
        {activeTab === 'finance' && renderList(financeCategories, "transacciones")}
        {activeTab === 'contacts' && renderList(contactCategories, "contactos")}

      </div>

      {/* Modal Nueva */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Nueva Categoría">
        <form action={handleCreate} className="flex flex-col gap-4">
          <Input label="Nombre" type="text" name="name" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <input type="color" name="color" defaultValue="#94a3b8" className="w-12 h-12 p-0 border-0 rounded-none cursor-pointer" />
          </div>
          {activeTab === "finance" && (
            <Select label="Tipo" name="type" options={[{value: "INGRESO", label: "Ingreso"}, {value: "GASTO", label: "Gasto"}]} />
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isPending}>Crear</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      {editingCategory && (
        <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title="Editar Categoría">
          <form action={handleUpdate} className="flex flex-col gap-4">
            <Input label="Nombre" type="text" name="name" defaultValue={editingCategory.name} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Color</label>
              <input type="color" name="color" defaultValue={editingCategory.color} className="w-12 h-12 p-0 border-0 rounded-none cursor-pointer" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setEditingCategory(null)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={isPending}>Guardar</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Reasignar */}
      {reassignData && (
        <Modal isOpen={!!reassignData} onClose={() => setReassignData(null)} title="Categoría en uso">
          <form action={handleReassignAndDelete} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Esta categoría tiene <strong>{reassignData.count}</strong> registros asociados. Para eliminarla, debes reasignar estos registros a otra categoría.
            </p>
            <Select 
              label="Reasignar a" 
              name="reassignToId" 
              options={reassignData.options.map((o: any) => ({ value: o.id, label: o.name }))} 
              required 
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setReassignData(null)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={isPending}>Reasignar y Eliminar</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
