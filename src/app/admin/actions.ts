"use server"

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

import { signOut } from "@/auth"

export async function createTenantAction(formData: FormData) {
  const session = await auth()
  
  if (!(session?.user as any)?.isSuperAdmin) {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const adminName = formData.get("adminName") as string
  const adminEmail = formData.get("adminEmail") as string
  const adminPassword = formData.get("adminPassword") as string

  if (!name || !adminEmail || !adminPassword) {
    throw new Error("Faltan campos obligatorios para crear la organización o el administrador")
  }

  // Create the tenant
  const tenant = await prisma.tenant.create({
    data: { name }
  })

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Find or create the user
  let user = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
      }
    })
  } else {
    // If user exists, optionally update their password/name if needed, or just link them.
  }

  // Link user to tenant as TENANT_ADMIN
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: "TENANT_ADMIN"
    }
  })

  revalidatePath("/admin/tenants")
  revalidatePath("/admin")
}

export async function logoutAction() {
  await signOut()
}

export async function updateTenantAction(id: string, name: string) {
  const session = await auth()
  if (!(session?.user as any)?.isSuperAdmin) {
    throw new Error("Unauthorized")
  }

  await prisma.tenant.update({
    where: { id },
    data: { name }
  })
  revalidatePath("/admin/tenants")
  revalidatePath("/admin")
}

export async function deleteTenantAction(id: string) {
  const session = await auth()
  if (!(session?.user as any)?.isSuperAdmin) {
    throw new Error("Unauthorized")
  }

  // TenantUser deletion should be handled by cascade or explicitly
  await prisma.tenantUser.deleteMany({
    where: { tenantId: id }
  })

  await prisma.tenant.delete({
    where: { id }
  })

  revalidatePath("/admin/tenants")
  revalidatePath("/admin")
}

export async function createUserAction(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin
  const currentTenantRole = (session.user as any).selectedTenantRole
  const currentTenantId = (session.user as any).selectedTenantId

  if (!isSuperAdmin && currentTenantRole !== "TENANT_ADMIN") {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "USER" | "TENANT_ADMIN"
  
  let targetTenantId = formData.get("tenantId") as string
  
  if (!targetTenantId) {
    targetTenantId = currentTenantId
  }

  if (!isSuperAdmin && targetTenantId !== currentTenantId) {
    throw new Error("Cannot create user for another tenant")
  }

  if (!email || !password || !targetTenantId) {
    throw new Error("Missing required fields")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  let user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    })
  }

  // Check if link exists
  const existingLink = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: targetTenantId,
        userId: user.id
      }
    }
  })

  if (!existingLink) {
    await prisma.tenantUser.create({
      data: {
        tenantId: targetTenantId,
        userId: user.id,
        role: role || "USER"
      }
    })
  } else {
    // Optionally update the role if they already exist in the tenant
    await prisma.tenantUser.update({
      where: { id: existingLink.id },
      data: { role: role || "USER" }
    })
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin")
}
