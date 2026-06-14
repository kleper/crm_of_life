import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import {
  getProductivitySummary,
  getGamificationProgress,
  getAchievementsOverview,
  getWeeklyProductivity,
  getCategoryDistribution,
  getTeamRanking,
  getContactsPendingFollowUp,
  getFinanceMonthBalance,
  getOrgCollaborationStats
} from "@/features/dashboard/queries";
import { getOrganizationGeneralSettings } from "@/features/settings/general/actions";
import { getKudoSummary, getPublicKudoWall } from "@/features/kudos/actions";

export const metadata = {
  title: 'Dashboard | CRM de la Vida',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!(session.user as any).selectedTenantId) {
    redirect("/select-tenant");
  }

  const currentTenantId = (session.user as any).selectedTenantId;
  const userId = session.user.id as string;

  const [
    productivity,
    gamification,
    achievements,
    weeklyChart,
    categoryChart,
    teamRanking,
    pendingContacts,
    financeBalance,
    collaborationStats,
    kudoSummary,
    publicKudoWall,
    tenant
  ] = await Promise.all([
    getProductivitySummary(userId, currentTenantId),
    getGamificationProgress(userId, currentTenantId),
    getAchievementsOverview(userId, currentTenantId),
    getWeeklyProductivity(userId, currentTenantId),
    getCategoryDistribution(userId, currentTenantId),
    getTeamRanking(currentTenantId, userId),
    getContactsPendingFollowUp(),
    getFinanceMonthBalance(),
    getOrgCollaborationStats(currentTenantId),
    getKudoSummary(userId, currentTenantId),
    getPublicKudoWall(currentTenantId, 5),
    getOrganizationGeneralSettings()
  ]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <DashboardClient 
        productivity={productivity}
        gamification={gamification}
        achievements={achievements}
        weeklyChart={weeklyChart}
        categoryChart={categoryChart}
        teamRanking={teamRanking}
        pendingContacts={pendingContacts}
        financeBalance={financeBalance}
        collaborationStats={collaborationStats}
        kudoSummary={kudoSummary}
        publicKudoWall={publicKudoWall}
        currency={tenant?.currency || "USD"}
      />
    </div>
  );
}
