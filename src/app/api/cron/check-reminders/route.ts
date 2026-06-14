import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import webpush from "web-push";

const prisma = new PrismaClient();

webpush.setVapidDetails(
  "mailto:admin@crmvida.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

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
        // Enviar notificación
        const subs = await prisma.pushSubscription.findMany({
          where: { 
            organizationId: contact.organizationId,
            userId: contact.createdByUserId
          }
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              },
              JSON.stringify({
                title: "Recordatorio de Contacto",
                body: `Es hora de contactar a ${contact.name}`,
                link: `/contacts/${contact.id}`
              })
            );
          } catch (e) {
            console.error("Push failed for endpoint", sub.endpoint, e);
          }
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

      const subs = await prisma.pushSubscription.findMany({
        where: { 
          organizationId: task.tenantId,
          userId: targetUserId
        }
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify({
              title: "Recordatorio de Rutina",
              body: `Tu tarea recurrente "${task.title}" vence hoy.`,
              link: `/tasks`,
              soundType: "default"
            })
          );
        } catch (e) {
          console.error("Push failed for endpoint", sub.endpoint, e);
        }
      }

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
