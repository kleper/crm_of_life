import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Si hay un tenant seleccionado, va a dashboard, sino middleware/layout lo manda a select-tenant
  redirect("/dashboard");
}
