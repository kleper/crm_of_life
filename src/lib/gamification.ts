// Fórmula base: Nivel = floor(sqrt(totalPoints / 100)) + 1
export const POINTS_PER_LEVEL_FACTOR = 100;

export function calculateLevel(totalPoints: number): number {
  return Math.floor(Math.sqrt(totalPoints / POINTS_PER_LEVEL_FACTOR)) + 1;
}

export function getPointsForNextLevel(currentLevel: number): number {
  // Puntos necesarios para alcanzar el nivel N: (N - 1)^2 * 100
  return Math.pow(currentLevel, 2) * POINTS_PER_LEVEL_FACTOR;
}

export function getPointsForCurrentLevel(currentLevel: number): number {
  return Math.pow(currentLevel - 1, 2) * POINTS_PER_LEVEL_FACTOR;
}

export function calculateLevelProgress(totalPoints: number, currentLevel: number): number {
  const pointsCurrentLevel = getPointsForCurrentLevel(currentLevel);
  const pointsNextLevel = getPointsForNextLevel(currentLevel);
  const progress = ((totalPoints - pointsCurrentLevel) / (pointsNextLevel - pointsCurrentLevel)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

// Helper para otorgar puntos por colaboración (ej. al completar una microtarea)
export async function awardCollaborationPoints(userId: string, tenantId: string, points: number) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  let userStats = await prisma.userStats.findUnique({
    where: { userId_tenantId: { userId, tenantId } }
  });

  if (!userStats) {
    userStats = await prisma.userStats.create({
      data: { userId, tenantId }
    });
  }

  const newTotalPoints = userStats.totalPoints + points;
  const newCollaborationPoints = userStats.collaborationPoints + points;
  const newLevel = calculateLevel(newTotalPoints);

  await prisma.userStats.update({
    where: { userId_tenantId: { userId, tenantId } },
    data: {
      totalPoints: newTotalPoints,
      collaborationPoints: newCollaborationPoints,
      currentLevel: newLevel
    }
  });

  return { newLevel, newTotalPoints };
}
