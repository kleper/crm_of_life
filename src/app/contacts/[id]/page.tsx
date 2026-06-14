import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getContactDetail } from "@/features/contacts/actions";
import { getContactCategories } from "@/features/settings/categories/actions";
import ContactDetailClient from "./ContactDetailClient";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!(session.user as any).selectedTenantId) {
    redirect("/select-tenant");
  }

  const [contact, categories] = await Promise.all([
    getContactDetail(id),
    getContactCategories()
  ]);

  if (!contact) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Contacto no encontrado</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ContactDetailClient contact={contact} categories={categories} />
    </div>
  );
}
