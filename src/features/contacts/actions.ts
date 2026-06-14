'use server'

import { revalidatePath } from "next/cache";
import { PrismaClient, InteractionType } from "@prisma/client";

const prisma = new PrismaClient();
import { auth } from "@/auth";

export async function createContact(data: {
  name: string;
  contactCategoryId?: string;
  relationshipType?: string; // legacy fallback
  phone?: string;
  email?: string;
  notes?: string;
  followUpFrequencyDays?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentTenantId = (session.user as any).selectedTenantId;
  if (!currentTenantId) throw new Error("No organization selected");

  const contact = await prisma.contact.create({
    data: {
      organizationId: currentTenantId,
      createdByUserId: session.user.id!,
      name: data.name,
      contactCategoryId: data.contactCategoryId || null,
      relationshipType: data.relationshipType || "General",
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      followUpFrequencyDays: data.followUpFrequencyDays,
    }
  });

  revalidatePath('/contacts');
  return contact;
}

export async function updateContact(id: string, data: {
  name?: string;
  contactCategoryId?: string;
  relationshipType?: string; // legacy fallback
  phone?: string;
  email?: string;
  notes?: string;
  followUpFrequencyDays?: number;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    throw new Error("Unauthorized");
  }

  const contact = await prisma.contact.update({
    where: { id, organizationId }, // ensures isolated to tenant
    data
  });

  revalidatePath('/contacts');
  revalidatePath(`/contacts/${id}`);
  return contact;
}

export async function deleteContact(id: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.contact.delete({
    where: { id, organizationId }
  });

  revalidatePath('/contacts');
}

export async function logInteraction(contactId: string, data: {
  type: InteractionType;
  notes?: string;
  interactionDate?: Date;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;
  const userId = session?.user?.id;

  if (!session || !organizationId || !userId) {
    throw new Error("Unauthorized");
  }

  const result = await prisma.$transaction(async (tx) => {
    const interaction = await tx.contactInteraction.create({
      data: {
        contactId,
        organizationId,
        createdByUserId: userId,
        type: data.type,
        notes: data.notes,
        interactionDate: data.interactionDate || new Date(),
      }
    });

    await tx.contact.update({
      where: { id: contactId, organizationId },
      data: {
        lastContactedAt: data.interactionDate || new Date(),
      }
    });

    // Gamification: Give +5 points for nurturing relations
    await tx.userStats.upsert({
      where: { userId_tenantId: { userId, tenantId: organizationId } },
      create: { userId, tenantId: organizationId, totalPoints: 5 },
      update: { totalPoints: { increment: 5 } }
    });

    await tx.userReward.create({
      data: {
        userId,
        points: 5,
        reason: 'Registro de interacción de contacto'
      }
    });

    return interaction;
  });

  revalidatePath('/contacts');
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath('/dashboard');
  return result;
}

export async function getContactsForCurrentUser() {
  const session = await auth();
  if (!session?.user) return [];

  const currentTenantId = (session.user as any).selectedTenantId;
  if (!currentTenantId) return [];

  const contacts = await prisma.contact.findMany({
    where: { organizationId: currentTenantId },
    include: { category: true },
    orderBy: { name: 'asc' }
  });

  const now = new Date();

  const enrichedContacts = contacts.map(c => {
    let needsFollowUp = false;
    let daysOverdue = 0;

    if (c.followUpFrequencyDays) {
      if (!c.lastContactedAt) {
        needsFollowUp = true;
        daysOverdue = 9999; // New contacts with followUp requirement
      } else {
        const diffTime = Math.abs(now.getTime() - c.lastContactedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > c.followUpFrequencyDays) {
          needsFollowUp = true;
          daysOverdue = diffDays - c.followUpFrequencyDays;
        }
      }
    }

    return { ...c, needsFollowUp, daysOverdue };
  });

  // Sort: Needs follow up first, then alphabetical
  enrichedContacts.sort((a, b) => {
    if (a.needsFollowUp && !b.needsFollowUp) return -1;
    if (!a.needsFollowUp && b.needsFollowUp) return 1;
    if (a.needsFollowUp && b.needsFollowUp) {
      return b.daysOverdue - a.daysOverdue;
    }
    return a.name.localeCompare(b.name);
  });

  return enrichedContacts;
}

export async function getContactDetail(contactId: string) {
  const session = await auth();
  const organizationId = (session?.user as any)?.selectedTenantId;

  if (!session || !organizationId) {
    return null;
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId, organizationId },
    include: {
      category: true,
      interactions: {
        orderBy: { interactionDate: 'desc' }
      }
    }
  });

  return contact;
}
