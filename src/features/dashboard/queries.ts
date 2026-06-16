import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { calculateLevelProgress } from "@/lib/gamification"

const prisma = new PrismaClient()

export async function getProductivitySummary(userId: string, organizationId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)) // Monday
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const tasks = await prisma.task.findMany({
    where: {
      tenantId: organizationId,
      OR: [
        { assignedTo: userId },
        { createdByUserId: userId }
      ]
    }
  })

  let completedToday = 0
  let completedThisWeek = 0
  let completedThisMonth = 0
  let overdue = 0
  let pending = 0
  let totalAssigned = 0

  tasks.forEach(task => {
    totalAssigned++
    
    if (task.status === "DONE" && task.completedAt) {
      const completedDate = new Date(task.completedAt)
      completedDate.setHours(0,0,0,0)
      
      if (completedDate.getTime() === today.getTime()) completedToday++
      if (completedDate >= startOfWeek) completedThisWeek++
      if (completedDate >= startOfMonth) completedThisMonth++
    } else {
      pending++
      if (task.dueDate && new Date(task.dueDate) < today) {
        overdue++
      }
    }
  })

  // Tasa de completitud del mes (tareas completadas este mes / total de tareas creadas o completadas este mes o activas)
  // Simplificamos: (completadas este mes) / (completadas este mes + pendientes creadas este mes)
  const activeOrCompletedThisMonth = tasks.filter(t => 
    (t.status === "DONE" && t.completedAt && new Date(t.completedAt) >= startOfMonth) ||
    (t.status !== "DONE" && t.createdAt >= startOfMonth)
  )

  const completionRate = activeOrCompletedThisMonth.length > 0 
    ? Math.round((completedThisMonth / activeOrCompletedThisMonth.length) * 100) 
    : 0

  return {
    completedToday,
    completedThisWeek,
    completedThisMonth,
    pending,
    overdue,
    completionRate
  }
}

export async function getWeeklyProductivity(userId: string, organizationId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })

  const sevenDaysAgo = last7Days[0]

  const completedTasks = await prisma.task.findMany({
    where: {
      tenantId: organizationId,
      OR: [
        { assignedTo: userId },
        { createdByUserId: userId }
      ],
      status: "DONE",
      completedAt: {
        gte: sevenDaysAgo
      }
    }
  })

  return last7Days.map(date => {
    const count = completedTasks.filter(t => {
      const d = new Date(t.completedAt!)
      d.setHours(0,0,0,0)
      return d.getTime() === date.getTime()
    }).length

    return {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      count
    }
  })
}

export async function getCategoryDistribution(userId: string, organizationId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Show ALL tasks with categories (not just completed ones) so the panel
  // isn't empty when the user has active tasks. Uses createdAt OR completedAt
  // within the last 30 days to capture both active and recently finished work.
  const tasks = await prisma.task.findMany({
    where: {
      tenantId: organizationId,
      OR: [
        { assignedTo: userId },
        { createdByUserId: userId }
      ],
      categoryId: { not: null },
      // Include tasks created in last 30 days OR completed in last 30 days
      // OR still pending (not done) regardless of creation date
      AND: [
        {
          OR: [
            { status: { not: "DONE" } },
            { completedAt: { gte: thirtyDaysAgo } },
            { createdAt: { gte: thirtyDaysAgo } }
          ]
        }
      ]
    },
    include: {
      category: true
    }
  })

  const distribution: Record<string, { categoryName: string, color: string, count: number, totalPoints: number }> = {}

  tasks.forEach(task => {
    if (!task.categoryId || !task.category) return
    const catId = task.categoryId
    
    if (!distribution[catId]) {
      distribution[catId] = {
        categoryName: task.category.name,
        color: task.category.color,
        count: 0,
        totalPoints: 0
      }
    }
    
    distribution[catId].count++
    distribution[catId].totalPoints += task.points
  })

  return Object.values(distribution).sort((a, b) => b.count - a.count)
}

export async function getGamificationProgress(userId: string, organizationId: string) {
  let stats = await prisma.userStats.findUnique({
    where: { userId_tenantId: { userId, tenantId: organizationId } }
  })

  if (!stats) {
    stats = await prisma.userStats.create({
      data: { userId, tenantId: organizationId }
    })
  }

  const progressPct = calculateLevelProgress(stats.totalPoints, stats.currentLevel)
  // Puntos totales actuales vs puntos totales nivel actual
  // Falta al prox nivel = getPointsForNextLevel - totalPoints
  const pointsForNextLevel = Math.pow(stats.currentLevel, 2) * 100
  const pointsMissing = pointsForNextLevel - stats.totalPoints

  return {
    ...stats,
    progressPct,
    pointsMissing,
    pointsForNextLevel
  }
}

export async function getAchievementsOverview(userId: string, organizationId: string) {
  const allAchievements = await prisma.achievement.findMany()
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId, tenantId: organizationId }
  })

  const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u.unlockedAt]))

  const overview = allAchievements.map(ach => ({
    ...ach,
    unlocked: unlockedMap.has(ach.id),
    unlockedAt: unlockedMap.get(ach.id) || null
  }))

  // Ordenar: primero los desbloqueados (por fecha desc), luego pendientes por threshold asc
  return overview.sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1
    if (!a.unlocked && b.unlocked) return 1
    if (a.unlocked && b.unlocked) {
      return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
    }
    // ambos no desbloqueados
    return a.thresholdValue - b.thresholdValue
  })
}

export async function getContactsPendingFollowUp() {
  const session = await auth()
  const organizationId = (session?.user as any)?.selectedTenantId

  if (!session || !organizationId) {
    return []
  }

  const contacts = await prisma.contact.findMany({
    where: { organizationId, followUpFrequencyDays: { not: null } },
  })

  const now = new Date()
  const pending = contacts.filter(c => {
    if (!c.lastContactedAt) return true;
    const diffDays = Math.ceil(Math.abs(now.getTime() - c.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > (c.followUpFrequencyDays as number);
  }).map(c => {
    let daysOverdue = 9999;
    if (c.lastContactedAt) {
      daysOverdue = Math.ceil(Math.abs(now.getTime() - c.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)) - (c.followUpFrequencyDays as number);
    }
    return { ...c, daysOverdue };
  });

  pending.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return pending.slice(0, 5);
}

export async function getFinanceMonthBalance() {
  const session = await auth()
  const organizationId = (session?.user as any)?.selectedTenantId

  if (!session || !organizationId) {
    return { income: 0, expense: 0, balance: 0 }
  }

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      transactionDate: { gte: startDate, lte: endDate }
    },
    include: { category: true }
  });

  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.category.type === 'INGRESO') {
      income += t.amount.toNumber();
    } else {
      expense += t.amount.toNumber();
    }
  }

  return { income, expense, balance: income - expense };
}

export async function getTeamRanking(organizationId: string, currentUserId: string) {
  // Check total users in organization
  const userCount = await prisma.tenantUser.count({
    where: { tenantId: organizationId }
  })

  if (userCount <= 1) {
    return { isMultiplayer: false, ranking: [] }
  }

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: organizationId },
    include: {
      user: {
        select: { id: true, name: true, image: true }
      }
    }
  })

  const stats = await prisma.userStats.findMany({
    where: { tenantId: organizationId }
  })
  const statsMap = new Map(stats.map(s => [s.userId, s]))

  const ranking = tenantUsers.map(tu => {
    const s = statsMap.get(tu.userId) || { totalPoints: 0, currentLevel: 1, currentStreak: 0 }
    return {
      userId: tu.userId,
      name: tu.user.name || "Usuario Desconocido",
      image: tu.user.image,
      totalPoints: s.totalPoints,
      currentLevel: s.currentLevel,
      currentStreak: s.currentStreak,
      isCurrentUser: tu.userId === currentUserId
    }
  })

  // Ordenar por totalPoints desc, resolver empate por racha, luego nivel
  ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak
    return b.currentLevel - a.currentLevel
  })

  const rankingWithPos = ranking.map((r, i) => ({ ...r, position: i + 1 }))

  return { isMultiplayer: true, ranking: rankingWithPos }
}

export async function getOrgCollaborationStats(organizationId: string) {
  // Por cada usuario del tenant: total de Subtasks completadas (across todas las Tasks), 
  // total de Tasks donde participó como colaborador, y puntos de colaboración acumulados.
  
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: organizationId },
    include: {
      user: {
        select: { id: true, name: true, image: true }
      }
    }
  });

  const stats = await prisma.userStats.findMany({
    where: { tenantId: organizationId }
  });
  const statsMap = new Map(stats.map(s => [s.userId, s]));

  const completedSubtasks = await prisma.subtask.groupBy({
    by: ['completedByUserId'],
    where: {
      completed: true,
      completedByUserId: { not: null },
      task: { tenantId: organizationId }
    },
    _count: { _all: true }
  });
  const subtasksMap = new Map(completedSubtasks.map(c => [c.completedByUserId, c._count._all]));

  const collaborations = await prisma.taskCollaborator.groupBy({
    by: ['userId'],
    where: {
      task: { tenantId: organizationId }
    },
    _count: { _all: true }
  });
  const collabMap = new Map(collaborations.map(c => [c.userId, c._count._all]));

  const results = tenantUsers.map(tu => {
    const s = statsMap.get(tu.userId);
    return {
      userId: tu.userId,
      name: tu.user.name || "Usuario",
      image: tu.user.image,
      completedSubtasks: subtasksMap.get(tu.userId) || 0,
      tasksCollaborated: collabMap.get(tu.userId) || 0,
      collaborationPoints: s?.collaborationPoints || 0
    }
  });

  // Ordenar por collaborationPoints desc
  results.sort((a, b) => b.collaborationPoints - a.collaborationPoints);

  return results;
}
