"use server"

import { auth } from "@/auth"
import { PrismaClient, FinanceType } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

// === TAREAS (Category) ===
export async function getTaskCategories() {
  const session = await auth()
  if (!session?.user) return []
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) return []

  return await prisma.category.findMany({
    where: { tenantId: currentTenantId },
    include: { _count: { select: { tasks: true } } }
  })
}

export async function createTaskCategory(data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) throw new Error("No organization selected")

  await prisma.category.create({
    data: {
      tenantId: currentTenantId,
      name: data.name,
      color: data.color,
    }
  })
  revalidatePath("/settings/categories")
}

export async function updateTaskCategory(id: string, data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId
  
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.tenantId !== currentTenantId) throw new Error("Unauthorized")

  await prisma.category.update({
    where: { id },
    data
  })
  revalidatePath("/settings/categories")
  revalidatePath("/tasks")
}

export async function deleteTaskCategory(id: string, reassignToId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId

  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { tasks: true } } } })
  if (!category || category.tenantId !== currentTenantId) throw new Error("Unauthorized")

  if (category._count.tasks > 0 && !reassignToId) {
    return { error: 'CATEGORY_IN_USE', count: category._count.tasks }
  }

  if (reassignToId) {
    await prisma.task.updateMany({
      where: { categoryId: id },
      data: { categoryId: reassignToId }
    })
  }

  await prisma.category.delete({ where: { id } })
  revalidatePath("/settings/categories")
  revalidatePath("/tasks")
  return { success: true }
}

// === FINANZAS (FinanceCategory) ===
export async function getFinanceCategories() {
  const session = await auth()
  if (!session?.user) return []
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) return []

  return await prisma.financeCategory.findMany({
    where: { organizationId: currentTenantId },
    include: { _count: { select: { transactions: true } } }
  })
}

export async function createFinanceCategory(data: { name: string; color: string; type: FinanceType }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) throw new Error("No organization selected")

  await prisma.financeCategory.create({
    data: {
      organizationId: currentTenantId,
      name: data.name,
      color: data.color,
      type: data.type
    }
  })
  revalidatePath("/settings/categories")
}

export async function updateFinanceCategory(id: string, data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId
  
  const category = await prisma.financeCategory.findUnique({ where: { id } })
  if (!category || category.organizationId !== currentTenantId) throw new Error("Unauthorized")

  await prisma.financeCategory.update({
    where: { id },
    data: { name: data.name, color: data.color } // Not allowing type change to avoid messing up calculations
  })
  revalidatePath("/settings/categories")
  revalidatePath("/finance")
}

export async function deleteFinanceCategory(id: string, reassignToId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId

  const category = await prisma.financeCategory.findUnique({ where: { id }, include: { _count: { select: { transactions: true } } } })
  if (!category || category.organizationId !== currentTenantId) throw new Error("Unauthorized")

  if (category._count.transactions > 0 && !reassignToId) {
    return { error: 'CATEGORY_IN_USE', count: category._count.transactions }
  }

  if (reassignToId) {
    await prisma.transaction.updateMany({
      where: { financeCategoryId: id },
      data: { financeCategoryId: reassignToId }
    })
  }

  await prisma.financeCategory.delete({ where: { id } })
  revalidatePath("/settings/categories")
  revalidatePath("/finance")
  return { success: true }
}

// === CONTACTOS (ContactCategory) ===
export async function getContactCategories() {
  const session = await auth()
  if (!session?.user) return []
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) return []

  return await prisma.contactCategory.findMany({
    where: { organizationId: currentTenantId },
    include: { _count: { select: { contacts: true } } }
  })
}

export async function createContactCategory(data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId
  if (!currentTenantId) throw new Error("No organization selected")

  await prisma.contactCategory.create({
    data: {
      organizationId: currentTenantId,
      name: data.name,
      color: data.color,
    }
  })
  revalidatePath("/settings/categories")
}

export async function updateContactCategory(id: string, data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId
  
  const category = await prisma.contactCategory.findUnique({ where: { id } })
  if (!category || category.organizationId !== currentTenantId) throw new Error("Unauthorized")

  await prisma.contactCategory.update({
    where: { id },
    data
  })
  revalidatePath("/settings/categories")
  revalidatePath("/contacts")
}

export async function deleteContactCategory(id: string, reassignToId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const currentTenantId = (session.user as any).selectedTenantId

  const category = await prisma.contactCategory.findUnique({ where: { id }, include: { _count: { select: { contacts: true } } } })
  if (!category || category.organizationId !== currentTenantId) throw new Error("Unauthorized")

  if (category._count.contacts > 0 && !reassignToId) {
    return { error: 'CATEGORY_IN_USE', count: category._count.contacts }
  }

  if (reassignToId) {
    await prisma.contact.updateMany({
      where: { contactCategoryId: id },
      data: { contactCategoryId: reassignToId }
    })
  }

  await prisma.contactCategory.delete({ where: { id } })
  revalidatePath("/settings/categories")
  revalidatePath("/contacts")
  return { success: true }
}
