'use server'

import { revalidatePath } from "next/cache";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
import { auth } from "@/auth";

export async function createTransaction(data: {
  financeCategoryId: string;
  amount: number | Prisma.Decimal;
  description?: string;
  transactionDate?: Date;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;
  const userId = session?.user?.id;

  if (!session || !organizationId || !userId) {
    throw new Error("Unauthorized");
  }

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        organizationId,
        createdByUserId: userId,
        financeCategoryId: data.financeCategoryId,
        amount: data.amount,
        description: data.description,
        transactionDate: data.transactionDate || new Date(),
      }
    });

    // Gamification: Give +2 points for tracking finances
    await tx.userStats.upsert({
      where: { userId_tenantId: { userId, tenantId: organizationId } },
      create: { userId, tenantId: organizationId, totalPoints: 2 },
      update: { totalPoints: { increment: 2 } }
    });

    await tx.userReward.create({
      data: {
        userId,
        points: 2,
        reason: 'Registro de transacción financiera'
      }
    });

    return transaction;
  });

  revalidatePath('/finance');
  revalidatePath('/dashboard');
  return result;
}

export async function updateTransaction(id: string, data: {
  financeCategoryId?: string;
  amount?: number | Prisma.Decimal;
  description?: string;
  transactionDate?: Date;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    throw new Error("Unauthorized");
  }

  const transaction = await prisma.transaction.update({
    where: { id, organizationId },
    data
  });

  revalidatePath('/finance');
  revalidatePath('/dashboard');
  return transaction;
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.transaction.delete({
    where: { id, organizationId }
  });

  revalidatePath('/finance');
  revalidatePath('/dashboard');
}

export async function getTransactionsForCurrentUser(filters?: {
  month?: number; // 1-12
  year?: number;
  type?: 'INGRESO' | 'GASTO';
  categoryId?: string;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    return [];
  }

  const where: Prisma.TransactionWhereInput = {
    organizationId,
  };

  if (filters?.categoryId) {
    where.financeCategoryId = filters.categoryId;
  }

  if (filters?.type) {
    where.category = {
      ...(where.category as object || {}),
      type: filters.type
    };
  }

  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
    where.transactionDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { transactionDate: 'desc' }
  });

  return transactions;
}

export async function getMonthlySummary(month: number, year: number) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    return {
      totalIncome: new Prisma.Decimal(0),
      totalExpense: new Prisma.Decimal(0),
      balance: new Prisma.Decimal(0),
      distribution: []
    };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      category: true,
    }
  });

  let totalIncome = new Prisma.Decimal(0);
  let totalExpense = new Prisma.Decimal(0);
  const distributionMap = new Map<string, { name: string, color: string, amount: Prisma.Decimal }>();

  for (const t of transactions) {
    if (t.category.type === 'INGRESO') {
      totalIncome = totalIncome.add(t.amount);
    } else {
      totalExpense = totalExpense.add(t.amount);
      
      const current = distributionMap.get(t.financeCategoryId) || { name: t.category.name, color: t.category.color, amount: new Prisma.Decimal(0) };
      current.amount = current.amount.add(t.amount);
      distributionMap.set(t.financeCategoryId, current);
    }
  }

  const balance = totalIncome.sub(totalExpense);
  const distribution = Array.from(distributionMap.values()).map(d => ({
    name: d.name,
    color: d.color,
    amount: d.amount.toNumber()
  }));

  distribution.sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    balance,
    distribution
  };
}

export async function getFinanceCategories() {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    return [];
  }

  return prisma.financeCategory.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' }
  });
}
