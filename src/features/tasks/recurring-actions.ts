"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { humanizeRRule } from "@/lib/recurrence";

const prisma = new PrismaClient();

export async function createRecurringTaskTemplate(data: {
  title: string;
  description?: string;
  categoryId?: string;
  points: number;
  assignedToUserId?: string;
  rrule: string;
  startDate: Date;
  endDate?: Date;
  dueTime?: string;
  reminderMinutesBefore?: number;
  subtasks: { title: string; order: number }[];
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.selectedTenantId) throw new Error("Unauthorized");

  const template = await prisma.recurringTaskTemplate.create({
    data: {
      organizationId: user.selectedTenantId,
      createdByUserId: user.id!,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      points: data.points,
      assignedToUserId: data.assignedToUserId,
      rrule: data.rrule,
      startDate: data.startDate,
      endDate: data.endDate,
      dueTime: data.dueTime,
      reminderMinutesBefore: data.reminderMinutesBefore,
      subtaskTemplates: {
        create: data.subtasks.map(st => ({
          title: st.title,
          order: st.order
        }))
      }
    }
  });

  // Call the cron logic specifically for this template to generate initial tasks immediately
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/generate-recurring-tasks`, {
    headers: {
      "Authorization": `Bearer ${process.env.CRON_SECRET}`
    }
  }).catch(console.error);

  revalidatePath("/tasks");
  revalidatePath("/tasks/recurring");
  return template;
}

export async function updateRecurringTaskTemplate(id: string, data: any) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.selectedTenantId) throw new Error("Unauthorized");

  // Verify ownership/tenant
  const template = await prisma.recurringTaskTemplate.findUnique({ where: { id } });
  if (template?.organizationId !== user.selectedTenantId) throw new Error("Unauthorized");

  await prisma.recurringTaskTemplate.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      points: data.points,
      assignedToUserId: data.assignedToUserId,
      dueTime: data.dueTime,
      reminderMinutesBefore: data.reminderMinutesBefore,
    }
  });
  
  // Note: we don't modify already generated tasks based on Decisión #3.

  revalidatePath("/tasks");
  revalidatePath("/tasks/recurring");
}

export async function pauseRecurringTaskTemplate(id: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.selectedTenantId) throw new Error("Unauthorized");

  const template = await prisma.recurringTaskTemplate.findUnique({ where: { id } });
  if (template?.organizationId !== user.selectedTenantId) throw new Error("Unauthorized");

  await prisma.recurringTaskTemplate.update({
    where: { id },
    data: { isActive: false }
  });

  revalidatePath("/tasks/recurring");
}

export async function resumeRecurringTaskTemplate(id: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.selectedTenantId) throw new Error("Unauthorized");

  const template = await prisma.recurringTaskTemplate.findUnique({ where: { id } });
  if (template?.organizationId !== user.selectedTenantId) throw new Error("Unauthorized");

  await prisma.recurringTaskTemplate.update({
    where: { id },
    data: { isActive: true }
  });

  revalidatePath("/tasks/recurring");
}

export async function deleteRecurringTaskTemplate(id: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.selectedTenantId) throw new Error("Unauthorized");

  const template = await prisma.recurringTaskTemplate.findUnique({ where: { id } });
  if (template?.organizationId !== user.selectedTenantId) throw new Error("Unauthorized");

  await prisma.recurringTaskTemplate.delete({ where: { id } });

  revalidatePath("/tasks/recurring");
}

export async function getRecurringTaskTemplates() {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.selectedTenantId) return [];

  const templates = await prisma.recurringTaskTemplate.findMany({
    where: { organizationId: user.selectedTenantId },
    include: {
      category: true,
      _count: {
        select: { generatedTasks: { where: { status: { not: "DONE" } } } }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return templates.map(t => ({
    ...t,
    humanizedRRule: humanizeRRule(t.rrule)
  }));
}
