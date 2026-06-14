import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendPushNotification } from "@/lib/push";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenants = await prisma.tenant.findMany();
    let notificationsSent = 0;

    for (const tenant of tenants) {
      const now = new Date();
      const localTimeString = now.toLocaleString("en-US", { timeZone: tenant.timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
      const localDateString = now.toLocaleString("sv-SE", { timeZone: tenant.timezone }).split(' ')[0]; // YYYY-MM-DD
      
      const in15Mins = new Date(now.getTime() + 15 * 60000);
      const targetTimeStr = in15Mins.toLocaleString("en-US", { timeZone: tenant.timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
      
      const localDateStart = new Date(`${localDateString}T00:00:00Z`);
      const localDateEnd = new Date(`${localDateString}T23:59:59.999Z`);

      const tasks = await prisma.task.findMany({
        where: {
          tenantId: tenant.id,
          status: { not: "DONE" },
          dueTime: { not: null },
          dueTimeReminderSentAt: null,
          dueDate: {
            gte: localDateStart,
            lte: localDateEnd,
          }
        }
      });

      for (const task of tasks) {
        if (!task.dueTime) continue;
        
        const [taskHH, taskMM] = task.dueTime.split(":").map(Number);
        const taskTotalMins = taskHH * 60 + taskMM;
        
        const [nowHH, nowMM] = localTimeString.split(":").map(Number);
        const nowTotalMins = nowHH * 60 + nowMM;
        
        const diffMins = taskTotalMins - nowTotalMins;
        
        if (diffMins >= 0 && diffMins <= 15) {
          if (task.assignedTo) {
            const subs = await prisma.pushSubscription.findMany({
              where: { userId: task.assignedTo }
            });
            for (const sub of subs) {
              try {
                await sendPushNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  { title: `⏳ Vence pronto: ${task.title}`, body: `A las ${task.dueTime}`, url: "/tasks" }
                );
              } catch (e) {
                console.error("Failed to send push notification", e);
              }
            }
            
            await prisma.notification.create({
              data: {
                userId: task.assignedTo,
                organizationId: tenant.id,
                type: "TASK_DUE_SOON",
                title: `Vence pronto: ${task.title}`,
                body: `A las ${task.dueTime}`,
                link: "/tasks",
              }
            });
          }

          await prisma.task.update({
            where: { id: task.id },
            data: { dueTimeReminderSentAt: new Date() }
          });
          
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (error: any) {
    console.error("Error checking time-based reminders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
