import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TasksClient from "./TasksClient";
import { getTasksForCurrentUser, getUserStats, getCategories } from "@/features/tasks/actions";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const currentTenantId = (session.user as any).selectedTenantId;
  const currentUserId = session.user.id as string;
  if (!currentTenantId) redirect("/select-tenant");

  const tasks = await getTasksForCurrentUser();
  const stats = await getUserStats();
  const categories = await getCategories();
  
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: currentTenantId },
    include: { user: { select: { id: true, name: true, image: true } } }
  });

  return (
    <TasksClient 
      initialTasks={tasks} 
      initialStats={stats} 
      categories={categories} 
      tenantUsers={tenantUsers}
      currentTenantId={currentTenantId} 
      currentUserId={currentUserId}
    />
  );
}
