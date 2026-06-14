import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const organizationId = (session.user as any).selectedTenantId;

  if (!organizationId) {
    return NextResponse.json({ error: "No tenant selected" }, { status: 400 });
  }

  try {
    const subscription = await req.json();

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          userId,
          organizationId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
    } else {
      // Si ya existe pero para otro usuario/org lo actualizamos
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          userId,
          organizationId,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
