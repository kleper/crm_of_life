"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Input";
import { updateContact, deleteContact, logInteraction } from "@/features/contacts/actions";
import { InteractionType } from "@prisma/client";

export default function ContactDetailClient({ contact, categories }: { contact: any, categories: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  
  const [editData, setEditData] = useState({
    name: contact.name,
    contactCategoryId: contact.contactCategoryId || "",
    email: contact.email || "",
    phone: contact.phone || "",
    followUpFrequencyDays: contact.followUpFrequencyDays || ""
  });

  const handleUpdate = () => {
    startTransition(async () => {
      await updateContact(contact.id, {
        ...editData,
        followUpFrequencyDays: editData.followUpFrequencyDays ? parseInt(editData.followUpFrequencyDays.toString(), 10) : undefined,
      });
      setIsEditModalOpen(false);
      window.location.reload();
    });
  };

  const handleDelete = () => {
    if (confirm("¿Estás seguro de que deseas eliminar este contacto? Esta acción es irreversible.")) {
      startTransition(async () => {
        await deleteContact(contact.id);
        router.push("/contacts");
      });
    }
  };

  const handleLogInteraction = (formData: FormData) => {
    startTransition(async () => {
      const type = formData.get("type") as InteractionType;
      const notes = formData.get("notes") as string;
      const dateStr = formData.get("interactionDate") as string;
      
      const res = await logInteraction(contact.id, {
        type,
        notes,
        interactionDate: dateStr ? new Date(dateStr) : new Date(),
      });
      
      setIsInteractionModalOpen(false);
      window.location.reload();
    });
  };

  const interactionTypeConfig = {
    MEETING: { icon: "🤝", label: "Reunión", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    CALL: { icon: "📞", label: "Llamada", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    EMAIL: { icon: "✉️", label: "Correo", color: "bg-sky-100 text-sky-700 border-sky-200" },
    MESSAGE: { icon: "💬", label: "Mensaje", color: "bg-amber-100 text-amber-700 border-amber-200" },
    OTHER: { icon: "📝", label: "Otro", color: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  return (
    <div>
      <Link href="/contacts" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-6">
        ← Volver a Contactos
      </Link>

      {/* Header Profile */}
      <div className="bg-white border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 rounded-none">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shrink-0">
            {contact.name.substring(0,2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{contact.name}</h1>
            <div className="flex gap-3 items-center">
              {contact.category ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5" style={{ backgroundColor: contact.category.color || '#94a3b8' }}>
                  {contact.category.name}
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5">
                  {contact.relationshipType}
                </span>
              )}
              {contact.followUpFrequencyDays && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Seguimiento: {contact.followUpFrequencyDays} días
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>Editar Perfil</Button>
          <Button variant="primary" onClick={() => setIsInteractionModalOpen(true)}>+ Registrar Interacción</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-none">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Información de Contacto</h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                <div className="text-slate-800 font-medium">{contact.email || "No registrado"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono</div>
                <div className="text-slate-800 font-medium">{contact.phone || "No registrado"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Timeline */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Historial de Interacciones</h3>
          
          {contact.interactions.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 border border-slate-200 border-dashed text-slate-500">
              No has registrado ninguna interacción aún.
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {contact.interactions.map((interaction: any) => {
                const config = interactionTypeConfig[interaction.type as keyof typeof interactionTypeConfig];
                return (
                  <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 rounded-none ${config.color} z-10`}>
                      {config.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 bg-white border border-slate-200 shadow-sm rounded-none">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{config.label}</span>
                        <time className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(interaction.interactionDate).toLocaleDateString()}</time>
                      </div>
                      {interaction.notes && (
                        <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{interaction.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Contacto">
        <div className="flex flex-col gap-4">
          <Input 
            label="Nombre"
            type="text" 
            value={editData.name} 
            onChange={e => setEditData({...editData, name: e.target.value})} 
          />
          
          <Select 
            name="contactCategoryId" 
            label="Categoría" 
            defaultValue={editData.contactCategoryId}
            options={[
              { value: "", label: "General" },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]} 
            onChange={e => setEditData({...editData, contactCategoryId: e.target.value})}
          />

          <Input 
            label="Correo Electrónico"
            type="email" 
            value={editData.email} 
            onChange={e => setEditData({...editData, email: e.target.value})} 
          />
          <Input 
            label="Teléfono"
            type="tel" 
            value={editData.phone} 
            onChange={e => setEditData({...editData, phone: e.target.value})} 
          />
          <Input 
            label="Frecuencia Seguimiento (Días)"
            type="number" 
            value={editData.followUpFrequencyDays} 
            onChange={e => setEditData({...editData, followUpFrequencyDays: e.target.value})} 
            placeholder="Opcional" 
          />

          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={handleDelete} className="text-red-600 hover:bg-red-50">Eliminar</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleUpdate} disabled={isPending}>Guardar</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Interaction Modal */}
      <Modal isOpen={isInteractionModalOpen} onClose={() => setIsInteractionModalOpen(false)} title="Registrar Interacción">
        <form action={handleLogInteraction} className="flex flex-col gap-4">
          <Select 
            name="type" 
            label="Tipo de Interacción"
            options={[
              { value: "CALL", label: "Llamada" },
              { value: "MEETING", label: "Reunión" },
              { value: "EMAIL", label: "Correo" },
              { value: "MESSAGE", label: "Mensaje" },
              { value: "OTHER", label: "Otro" }
            ]} 
            required 
          />
          <Input 
            label="Fecha"
            type="date" 
            name="interactionDate" 
            defaultValue={new Date().toISOString().split('T')[0]} 
            required 
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Notas</label>
            <textarea name="notes" className="w-full p-2 border border-slate-300 rounded-none text-sm min-h-[100px]" placeholder="¿Qué se habló? ¿Próximos pasos?"></textarea>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsInteractionModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isPending}>Guardar Registro</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
