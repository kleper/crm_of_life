import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // En un entorno real, proteger este endpoint con un cron secret
  try {
    const today = new Date();
    
    // Buscar contactos que necesiten seguimiento
    const contacts = await prisma.contact.findMany({
      where: {
        followUpFrequencyDays: { not: null }
      },
      include: {
        tenant: true
      }
    });

    for (const contact of contacts) {
      if (!contact.followUpFrequencyDays) continue;
      
      const lastContactDate = contact.lastContactedAt || contact.createdAt;
      const diffTime = Math.abs(today.getTime() - lastContactDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= contact.followUpFrequencyDays) {
        if (contact.createdByUserId) {
          await sendPushToUser(contact.createdByUserId, {
            title: "Recordatorio de Contacto",
            body: `Es hora de contactar a ${contact.name}`,
            link: `/contacts/${contact.id}`
          });
        }
      }
    }

    // Check Recurring Tasks due today
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const recurringTasks = await prisma.task.findMany({
      where: {
        recurringTemplateId: { not: null },
        status: { not: "DONE" },
        dueDate: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      include: {
        recurringTemplate: true
      }
    });

    for (const task of recurringTasks) {
      if (!task.recurringTemplate || !task.recurringTemplate.reminderMinutesBefore) continue;
      
      const targetUserId = task.assignedTo || task.createdByUserId;
      if (!targetUserId) continue;

      await sendPushToUser(targetUserId, {
        title: "Recordatorio de Rutina",
        body: `Tu tarea recurrente "${task.title}" vence hoy.`,
        link: `/tasks`,
        soundType: "default"
      });

      await prisma.notification.create({
        data: {
          userId: task.assignedTo || task.createdByUserId!,
          organizationId: task.tenantId,
          type: "RECURRING_TASK_DUE",
          title: "Recordatorio de Rutina",
          body: `Tu tarea recurrente "${task.title}" vence hoy.`,
          link: `/tasks`
        }
      });
    }

    return NextResponse.json({ success: true, contactsProcessed: contacts.length, recurringTasksProcessed: recurringTasks.length });
  } catch (error) {
    console.error("Cron check failed", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
