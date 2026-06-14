"use server";

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getTaskCollaborationSummary(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      collaborators: {
        include: { user: true }
      },
      subtasks: true
    }
  });

  if (!task) return [];

  const subtasks = task.subtasks;
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;

  const summary = task.collaborators.map(collab => {
    const userId = collab.userId;
    const assignedCount = subtasks.filter(s => s.assignedToUserId === userId).length;
    const completedCount = subtasks.filter(s => s.completedByUserId === userId).length;
    
    let percentage = 0;
    if (completedSubtasksCount > 0) {
      percentage = Math.round((completedCount / completedSubtasksCount) * 100);
    }

    return {
      userId,
      name: collab.user.name || "Usuario",
      image: collab.user.image,
      assignedCount,
      completedCount,
      percentage
    }
  });

  return summary;
}
