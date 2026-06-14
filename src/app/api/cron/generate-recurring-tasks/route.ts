import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getOccurrencesInRange } from "@/lib/recurrence";

const prisma = new PrismaClient();
const GENERATION_WINDOW_DAYS = 2;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await prisma.recurringTaskTemplate.findMany({
      where: { isActive: true },
      include: { subtaskTemplates: true }
    });

    let templatesProcessed = 0;
    let tasksCreated = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDate = new Date(today);
    toDate.setDate(toDate.getDate() + GENERATION_WINDOW_DAYS);
    toDate.setHours(23, 59, 59, 999);

    for (const template of templates) {
      let fromDate = template.lastGeneratedDate ? new Date(template.lastGeneratedDate) : new Date(template.startDate);
      // Start generating from the next day after lastGeneratedDate, or from startDate if never generated
      if (template.lastGeneratedDate) {
        fromDate.setDate(fromDate.getDate() + 1);
        fromDate.setHours(0, 0, 0, 0);
      }

      if (fromDate > toDate) continue;

      const occurrences = getOccurrencesInRange(template, fromDate, toDate);

      for (const occurrenceDate of occurrences) {
        occurrenceDate.setHours(12, 0, 0, 0); // Noon to avoid timezone shift issues on rendering

        const subtasksData = template.subtaskTemplates.map(st => ({
          title: st.title,
          order: st.order,
          completed: false
        }));

        await prisma.task.create({
          data: {
            title: template.title,
            description: template.description,
            categoryId: template.categoryId,
            points: template.points,
            assignedTo: template.assignedToUserId || template.createdByUserId,
            tenantId: template.organizationId,
            createdByUserId: template.createdByUserId,
            dueDate: occurrenceDate,
            dueTime: template.dueTime,
            status: "TODO",
            recurringTemplateId: template.id,
            recurrenceOccurrenceDate: occurrenceDate,
            subtasks: {
              create: subtasksData
            }
          }
        });

        tasksCreated++;
      }

      // Update last generated date to the end of the window (toDate) so we don't regenerate
      await prisma.recurringTaskTemplate.update({
        where: { id: template.id },
        data: { lastGeneratedDate: toDate }
      });

      templatesProcessed++;
    }

    return NextResponse.json({ success: true, templatesProcessed, tasksCreated });
  } catch (error: any) {
    console.error("Error generating recurring tasks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
