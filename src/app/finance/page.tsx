import { auth } from "@/auth";
import { getFinanceCategories, getTransactionsForCurrentUser, getMonthlySummary } from "@/features/finance/actions";
import { getOrganizationGeneralSettings } from "@/features/settings/general/actions";
import FinanceClient from "./FinanceClient";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  if (!(session.user as any).selectedTenantId) {
    redirect("/select-tenant");
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const categories = await getFinanceCategories();
  const rawTransactions = await getTransactionsForCurrentUser({ month: currentMonth, year: currentYear });
  const rawSummary = await getMonthlySummary(currentMonth, currentYear);
  const tenant = await getOrganizationGeneralSettings();

  // Serialize to pass to client component
  const summary = {
    totalIncome: rawSummary.totalIncome.toNumber(),
    totalExpense: rawSummary.totalExpense.toNumber(),
    balance: rawSummary.balance.toNumber(),
    distribution: rawSummary.distribution.map(d => ({
      ...d,
      amount: Number(d.amount)
    }))
  };

  const transactions = rawTransactions.map(t => ({
    id: t.id,
    amount: t.amount.toNumber(),
    description: t.description,
    transactionDate: t.transactionDate.toISOString(),
    financeCategoryId: t.financeCategoryId,
    category: {
      id: t.category.id,
      name: t.category.name,
      type: t.category.type,
      color: t.category.color,
    }
  }));

  const plainCategories = categories.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
  }));

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>
      <FinanceClient 
        categories={plainCategories}
        transactions={transactions}
        summary={summary}
        currency={tenant?.currency || "USD"}
      />
    </div>
  );
}
