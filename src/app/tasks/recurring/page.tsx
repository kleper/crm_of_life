import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRecurringTaskTemplates } from "@/features/tasks/recurring-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import RecurringTasksClient from "./RecurringTasksClient";

export default async function RecurringTasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const templates = await getRecurringTaskTemplates();

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader 
          title="Tareas Recurrentes" 
          description="Tus rutinas y hábitos automáticos."
        />
        <RecurringTasksClient initialTemplates={templates} />
      </div>
    </div>
  );
}
