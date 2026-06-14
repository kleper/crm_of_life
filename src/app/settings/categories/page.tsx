import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CategoriesClient from "./CategoriesClient"
import { getTaskCategories, getFinanceCategories, getContactCategories } from "@/features/settings/categories/actions"

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as any).selectedTenantRole
  const isSuperAdmin = (session.user as any).isSuperAdmin
  if (role !== "TENANT_ADMIN" && !isSuperAdmin) {
    redirect("/dashboard")
  }

  const taskCategories = await getTaskCategories()
  const financeCategories = await getFinanceCategories()
  const contactCategories = await getContactCategories()

  return (
    <CategoriesClient 
      taskCategories={taskCategories}
      financeCategories={financeCategories}
      contactCategories={contactCategories}
    />
  )
}
