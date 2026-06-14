"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function updateNotificationPreferences(enabled: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  await prisma.user.update({
    where: { id: userId },
    data: { notificationSoundsEnabled: enabled }
  });

  revalidatePath("/profile");
}
