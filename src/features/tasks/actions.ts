"use server"

import { auth } from "@/auth"
import { PrismaClient, TaskStatus, ThresholdType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { calculateLevel } from "@/lib/gamification"
import { sendPushToUser } from "@/lib/push"

const prisma = new PrismaClient()

export async function getTasksForCurrentUser() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const currentTenantId = (session.user as any).selectedTenantId
  const currentTenantRole = (session.user as any).selectedTenantRole
  const isSuperAdmin = (session.user as any).isSuperAdmin
  const userId = session.user.id as string

  if (!currentTenantId) {
    return []
  }

  // If TENANT_ADMIN or isSuperAdmin, return all tasks for tenant
  // Else return only assigned tasks
  let whereClause: any = { tenantId: currentTenantId }
  
  if (!isSuperAdmin && currentTenantRole !== "TENANT_ADMIN") {
    // Only assigned or created by them or collaborator
    whereClause.OR = [
      { assignedTo: userId },
      { createdByUserId: userId },
      { collaborators: { some: { userId: userId } } }
    ]
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      category: true,
      assignee: {
        select: { id: true, name: true, image: true }
      },
      collaborators: {
        include: { user: { select: { id: true, name: true, image: true } } }
      },
      subtasks: {
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return tasks
}

export async function getCategories() {
  const session = await auth()
  if (!session?.user) return []
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) return []

  return await prisma.category.findMany({
    where: { tenantId: currentTenantId }
  })
}

export async function createTask(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const currentTenantId = (session.user as any).selectedTenantId
  const userId = session.user.id as string

  if (!currentTenantId) {
    throw new Error("No organization selected")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const points = parseInt(formData.get("points") as string) || 10
  const categoryId = formData.get("categoryId") as string
  const dueDateStr = formData.get("dueDate") as string
  const dueTime = formData.get("dueTime") as string

  if (!title) {
    throw new Error("Title is required")
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      points,
      status: "TODO",
      tenantId: currentTenantId,
      createdByUserId: userId,
      assignedTo: userId, // Default assign to creator
      categoryId: categoryId || null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      dueTime: dueTime || null,
    }
  })

  // Enviar Push Notification
  if (task.assignedTo) {
    await sendPushToUser(task.assignedTo, {
      title: "Nueva Tarea Asignada", 
      body: task.title, 
      link: "/tasks"
    });
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
}

// Result interface for UI toast
export type GamificationResult = {
  unlockedAchievements: Array<{title: string, icon: string}>,
  levelUp: boolean,
  newLevel: number,
  pointsEarned: number
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<GamificationResult | null> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  const userId = session.user.id as string

  if (!currentTenantId) throw new Error("No organization selected")

  // Find task to ensure it belongs to the tenant
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  })

  if (!task || task.tenantId !== currentTenantId) {
    throw new Error("Task not found or unauthorized")
  }

  const isTransitioningToDone = newStatus === "DONE" && task.status !== "DONE"
  const isTransitioningFromDone = task.status === "DONE" && newStatus !== "DONE"

  // Update task
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt: newStatus === "DONE" ? new Date() : null
    }
  })

  let result: GamificationResult | null = null;

  if (isTransitioningToDone || isTransitioningFromDone) {
    // Get user stats
    let userStats = await prisma.userStats.findUnique({
      where: { userId_tenantId: { userId, tenantId: currentTenantId } }
    })

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: { userId, tenantId: currentTenantId }
      })
    }

    let newPoints = userStats.totalPoints;
    let newLevel = userStats.currentLevel;
    let newStreak = userStats.currentStreak;
    let longestStreak = userStats.longestStreak;
    let lastCompletionDate = userStats.lastCompletionDate;
    let levelUp = false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isTransitioningToDone) {
      newPoints += task.points;
      
      const calcLevel = calculateLevel(newPoints);
      if (calcLevel > newLevel) {
        newLevel = calcLevel;
        levelUp = true;
      }

      // Streak logic
      if (lastCompletionDate) {
        const lastDate = new Date(lastCompletionDate);
        lastDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          // completed yesterday
          newStreak += 1;
        } else if (diffDays > 1) {
          // missed a day
          newStreak = 1;
        }
        // if diffDays === 0, already completed a task today, streak remains same
      } else {
        newStreak = 1;
      }
      
      lastCompletionDate = new Date();
      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

    } else if (isTransitioningFromDone) {
      // Revert points, but do not touch streak logic (too complex to revert reliably)
      newPoints = Math.max(0, newPoints - task.points);
      newLevel = calculateLevel(newPoints);
    }

    // Save stats
    const updatedStats = await prisma.userStats.update({
      where: { id: userStats.id },
      data: {
        totalPoints: newPoints,
        currentLevel: newLevel,
        currentStreak: newStreak,
        longestStreak,
        lastCompletionDate
      }
    })

    // Check Achievements if transitioning to DONE
    const unlockedAchievementsList: Array<{title: string, icon: string}> = [];
    if (isTransitioningToDone) {
      // Fetch all achievements
      const allAchievements = await prisma.achievement.findMany()
      
      // Fetch user's unlocked achievements for this tenant
      const unlocked = await prisma.userAchievement.findMany({
        where: { userId, tenantId: currentTenantId }
      })
      const unlockedIds = new Set(unlocked.map(u => u.achievementId))

      // Determine total completed tasks
      const totalTasks = await prisma.task.count({
        where: { tenantId: currentTenantId, createdByUserId: userId, status: "DONE" }
      })

      for (const ach of allAchievements) {
        if (unlockedIds.has(ach.id)) continue;

        let thresholdMet = false;
        if (ach.thresholdType === "TOTAL_TASKS" && totalTasks >= ach.thresholdValue) thresholdMet = true;
        if (ach.thresholdType === "TOTAL_POINTS" && newPoints >= ach.thresholdValue) thresholdMet = true;
        if (ach.thresholdType === "STREAK_DAYS" && newStreak >= ach.thresholdValue) thresholdMet = true;

        if (thresholdMet) {
          await prisma.userAchievement.create({
            data: {
              userId,
              tenantId: currentTenantId,
              achievementId: ach.id
            }
          })
          unlockedAchievementsList.push({ title: ach.title, icon: ach.icon });
        }
      }
    }

    if (isTransitioningToDone) {
      result = {
        unlockedAchievements: unlockedAchievementsList,
        levelUp,
        newLevel,
        pointsEarned: task.points
      }
    }
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")

  return result;
}

export async function deleteTask(taskId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) throw new Error("No organization selected")

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.tenantId !== currentTenantId) {
    throw new Error("Task not found or unauthorized")
  }

  await prisma.task.delete({ where: { id: taskId } })

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
}

export async function getUserStats() {
  const session = await auth()
  if (!session?.user) return null

  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) return null

  const userId = session.user.id as string

  let stats = await prisma.userStats.findUnique({
    where: { userId_tenantId: { userId, tenantId: currentTenantId } }
  })

  // Ensure default stats
  if (!stats) {
    stats = await prisma.userStats.create({
      data: { userId, tenantId: currentTenantId }
    })
  }

  return stats
}

export async function updateTask(taskId: string, data: { title?: string; description?: string; categoryId?: string; points?: number; dueDate?: string; dueTime?: string; status?: TaskStatus }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) throw new Error("No organization selected")

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.tenantId !== currentTenantId) {
    throw new Error("Task not found or unauthorized")
  }

  // Si cambia el estado a DONE o vuelve de DONE, usamos updateTaskStatus para aprovechar la gamificación
  if (data.status && data.status !== task.status) {
    await updateTaskStatus(taskId, data.status);
    delete data.status; // Remove it so we don't double update, or just continue updating the rest
  }

  // Update rest of fields
  const updateData: any = { ...data };
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }
  if (updateData.categoryId === "") {
    updateData.categoryId = null;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });
  }

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
}

export async function addSubtask(taskId: string, title: string, dueDate?: string | null) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) throw new Error("No organization selected")

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { subtasks: true } })
  if (!task || task.tenantId !== currentTenantId) {
    throw new Error("Task not found or unauthorized")
  }

  const order = task.subtasks.length;
  await prisma.subtask.create({
    data: {
      taskId,
      title,
      order,
      dueDate: dueDate ? new Date(dueDate) : null
    }
  });

  revalidatePath("/tasks")
}

export async function updateSubtaskDueDate(subtaskId: string, dueDate: string | null) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, include: { task: true } })
  
  if (!subtask || subtask.task.tenantId !== currentTenantId) {
    throw new Error("Subtask not found or unauthorized")
  }

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      dueDate: dueDate ? new Date(dueDate) : null
    }
  });

  revalidatePath("/tasks")
}

import { awardCollaborationPoints } from "@/lib/gamification";

export async function toggleSubtask(subtaskId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  const currentUserId = session.user.id as string

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, include: { task: true } })
  
  if (!subtask || subtask.task.tenantId !== currentTenantId) {
    throw new Error("Subtask not found or unauthorized")
  }

  const newStatus = !subtask.completed;

  // Reparto de puntos: Bono de colaboración de 2 puntos
  if (newStatus && !subtask.completed) {
    await awardCollaborationPoints(currentUserId, currentTenantId, 2);
  } else if (!newStatus && subtask.completed && subtask.completedByUserId) {
    await awardCollaborationPoints(subtask.completedByUserId, currentTenantId, -2);
  }

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      completed: newStatus,
      completedAt: newStatus ? new Date() : null,
      completedByUserId: newStatus ? currentUserId : null
    }
  });

  revalidatePath("/tasks")
}

export async function assignTaskCollaborators(taskId: string, userIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  const currentUserId = session.user.id as string

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.tenantId !== currentTenantId) {
    throw new Error("Task not found or unauthorized")
  }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: currentTenantId, userId: currentUserId } }
  });
  const isTenantAdmin = tenantUser?.role === "TENANT_ADMIN" || (session.user as any).isSuperAdmin;
  const isOwner = task.createdByUserId === currentUserId || task.assignedTo === currentUserId;

  if (!isTenantAdmin && !isOwner) {
    throw new Error("No tienes permisos para modificar los colaboradores de esta tarea");
  }

  const validUsers = await prisma.tenantUser.findMany({
    where: {
      tenantId: currentTenantId,
      userId: { in: userIds }
    }
  });

  if (validUsers.length !== userIds.length) {
    throw new Error("Algunos usuarios no pertenecen a la organización actual");
  }

  await prisma.taskCollaborator.deleteMany({
    where: {
      taskId: taskId,
      userId: { notIn: userIds }
    }
  });

  const existingCollaborators = await prisma.taskCollaborator.findMany({
    where: { taskId: taskId }
  });
  const existingIds = existingCollaborators.map(c => c.userId);

  const toAdd = userIds.filter(id => !existingIds.includes(id));

  if (toAdd.length > 0) {
    await prisma.taskCollaborator.createMany({
      data: toAdd.map(userId => ({
        taskId: taskId,
        userId: userId
      }))
    });
  }

  revalidatePath("/tasks");
}

export async function assignSubtask(subtaskId: string, userId: string | null) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, include: { task: true } })
  
  if (!subtask || subtask.task.tenantId !== currentTenantId) {
    throw new Error("Subtask not found or unauthorized")
  }

  if (userId) {
    const isCollaborator = await prisma.taskCollaborator.findUnique({
      where: { taskId_userId: { taskId: subtask.taskId, userId } }
    });
    if (!isCollaborator && subtask.task.assignedTo !== userId) {
      throw new Error("El usuario debe ser colaborador de la tarea");
    }
  }

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      assignedToUserId: userId
    }
  });

  revalidatePath("/tasks");
}

export async function deleteSubtask(subtaskId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const currentTenantId = (session.user as any).selectedTenantId
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, include: { task: true } })
  
  if (!subtask || subtask.task.tenantId !== currentTenantId) {
    throw new Error("Subtask not found or unauthorized")
  }

  await prisma.subtask.delete({ where: { id: subtaskId } });

  revalidatePath("/tasks")
}
