import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import KudosClient from "./KudosClient";
import { getReceivedKudos, getSentKudos, getKudoSummary, getPublicKudoWall } from "@/features/kudos/actions";

export default async function KudosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const currentTenantId = (session.user as any).selectedTenantId;
  const currentUserId = session.user.id as string;
  if (!currentTenantId) redirect("/select-tenant");

  const receivedKudos = await getReceivedKudos(currentUserId, currentTenantId);
  const sentKudos = await getSentKudos(currentUserId, currentTenantId);
  const summary = await getKudoSummary(currentUserId, currentTenantId);
  const publicWall = await getPublicKudoWall(currentTenantId, 20);

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: currentTenantId },
    include: { user: { select: { id: true, name: true, image: true, email: true } } }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          🏆 Reconocimientos
        </h1>
        <p className="text-sm text-slate-500">
          Celebra los logros y el esfuerzo de tu equipo.
        </p>
      </div>
      
      <KudosClient 
        receivedKudos={receivedKudos}
        sentKudos={sentKudos}
        summary={summary}
        publicWall={publicWall}
        currentUserId={currentUserId}
        tenantUsers={tenantUsers}
      />
    </div>
  );
}
