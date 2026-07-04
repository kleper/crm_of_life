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

    // Validate the subscription body
    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription format" }, { status: 400 });
    }

    // Upsert: create if new, update keys if the endpoint already exists
    // This handles re-subscriptions after browser/OS purges the subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        organizationId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        organizationId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
