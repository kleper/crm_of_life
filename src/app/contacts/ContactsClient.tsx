"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { createContact } from "@/features/contacts/actions";

export default function ContactsClient({ initialContacts, categories }: { initialContacts: any[], categories: any[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Gamification states
  const [showGamification, setShowGamification] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const data = {
        name: formData.get('name') as string,
        contactCategoryId: formData.get('contactCategoryId') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        followUpFrequencyDays: formData.get('followUpFrequencyDays') ? parseInt(formData.get('followUpFrequencyDays') as string, 10) : undefined,
      };

      await createContact(data);
      
      // Simulate optimistic addition with a refresh
      window.location.reload(); 
    });
  };

  return (
    <div>
      {/* Search and Add */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Buscar contactos..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2 text-slate-400">🔍</span>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Nuevo Contacto
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <Link href={`/contacts/${contact.id}`} key={contact.id} className="block group">
            <div className="bg-white border border-slate-200 p-5 h-full hover:border-indigo-400 hover:shadow-md transition-all rounded-none relative overflow-hidden">
              {contact.needsFollowUp && (
                <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">
                  {contact.name}
                </h3>
                {contact.category ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5" style={{ backgroundColor: contact.category.color || '#94a3b8' }}>
                    {contact.category.name}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5">
                    {contact.relationshipType}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                {contact.email && <div className="flex items-center gap-2"><span className="opacity-50">✉️</span> {contact.email}</div>}
                {contact.phone && <div className="flex items-center gap-2"><span className="opacity-50">📱</span> {contact.phone}</div>}
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {contact.lastContactedAt ? `Último contacto: ${new Date(contact.lastContactedAt).toLocaleDateString()}` : 'Nunca contactado'}
                </div>
                {contact.needsFollowUp && (
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 uppercase tracking-wider">
                    Seguimiento
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {contacts.length === 0 && (
        <div className="bg-white border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No tienes contactos</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Añade tu primer contacto para empezar a construir y mantener relaciones significativas.</p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>Añadir mi primer contacto</Button>
        </div>
      )}

      {/* New Contact Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Contacto">
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Input required name="name" label="Nombre Completo" placeholder="Ej. Juan Pérez" />
          
          <Select 
            name="contactCategoryId" 
            label="Categoría" 
            options={[
              { value: "", label: "General" },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]} 
          />

          <Input type="email" name="email" label="Correo Electrónico" placeholder="juan@ejemplo.com" />
          <Input type="tel" name="phone" label="Teléfono" placeholder="+34 600 000 000" />
          
          <div className="p-4 bg-slate-50 border border-slate-200 mt-2">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Frecuencia de Seguimiento (Opcional)</h4>
            <p className="text-xs text-slate-500 mb-3">Si quieres que te recordemos mantener el contacto, ¿cada cuántos días deberías hablar con esta persona?</p>
            <Input type="number" name="followUpFrequencyDays" label="Días" placeholder="Ej. 30" min={1} />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isPending}>Guardar Contacto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
