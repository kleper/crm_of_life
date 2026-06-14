import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any)?.selectedTenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant selected" }, { status: 400 });
  }

  try {
    const { queue } = await req.json();

    if (!Array.isArray(queue)) {
      return NextResponse.json({ error: "Invalid queue format" }, { status: 400 });
    }

    const results = [];

    for (const item of queue) {
      try {
        if (item.type === "CREATE_TASK") {
          const { title, description, categoryId, dueDate, status } = item.payload;
          
          const task = await prisma.task.create({
            data: {
              title,
              description,
              categoryId: categoryId || null,
              dueDate: dueDate ? new Date(dueDate) : null,
              status: status || "TODO",
              tenantId,
              createdByUserId: session.user.id,
            }
          });
          results.push({ id: item.id, status: "success", taskId: task.id });
        } else {
          results.push({ id: item.id, status: "skipped", reason: "Unknown type" });
        }
      } catch (err: any) {
        results.push({ id: item.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
