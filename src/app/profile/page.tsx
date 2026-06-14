import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { PageHeader } from "@/components/ui/PageHeader";

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, notificationSoundsEnabled: true }
  });

  if (!user) redirect("/login");

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
      <PageHeader 
        title="Mi Perfil" 
        description="Administra tus preferencias y cuenta"
      />
      <div className="mt-8">
        <ProfileClient 
          initialName={user.name || ""}
          initialEmail={user.email || ""}
          initialSoundsEnabled={user.notificationSoundsEnabled}
        />
      </div>
    </div>
  );
}
