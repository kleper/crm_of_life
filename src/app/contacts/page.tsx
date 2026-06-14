import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getContactsForCurrentUser } from "@/features/contacts/actions";
import { getContactCategories } from "@/features/settings/categories/actions";
import ContactsClient from "./ContactsClient";

export const metadata = {
  title: 'Contactos | CRM de la Vida',
};

export default async function ContactsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!(session.user as any).selectedTenantId) {
    redirect("/select-tenant");
  }

  const [contacts, categories] = await Promise.all([
    getContactsForCurrentUser(),
    getContactCategories()
  ]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Contactos</h1>
          <p className="text-slate-500">Mantén vivas tus relaciones importantes.</p>
        </div>
      </div>

      <ContactsClient initialContacts={contacts} categories={categories} />
    </div>
  );
}
