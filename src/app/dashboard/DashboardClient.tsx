"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getKudoOptions } from "@/lib/kudos";
import { formatCurrency } from "@/lib/currency";

interface DashboardClientProps {
  productivity: {
    completedToday: number;
    completedThisWeek: number;
    completedThisMonth: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  weeklyChart: Array<{ date: string; dayName: string; count: number }>;
  categoryChart: Array<{ categoryName: string; color: string; count: number; totalPoints: number }>;
  gamification: {
    totalPoints: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    progressPct: number;
    pointsMissing: number;
    pointsForNextLevel: number;
  };
  achievements: Array<any>;
  teamRanking: {
    isMultiplayer: boolean;
    ranking: Array<any>;
  };
  pendingContacts: Array<any>;
  financeBalance: {
    income: number;
    expense: number;
    balance: number;
  };
  collaborationStats: Array<{
    userId: string;
    name: string;
    image: string | null;
    completedSubtasks: number;
    collaborationPoints: number;
  }>;
  kudoSummary?: {
    received: Record<string, number>;
    totalSent: number;
  };
  publicKudoWall?: Array<any>;
  currency: string;
}

export default function DashboardClient({
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
  currency
}: DashboardClientProps) {
  const router = useRouter();
  
  // Custom SVG Bar Chart Calculation
  const maxWeeklyCount = Math.max(...weeklyChart.map(w => w.count), 1); 
  const hasWeeklyData = weeklyChart.some(w => w.count > 0);
  
  // Gamification Circular Progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gamification.progressPct / 100) * circumference;

  return (
    /* CRITICAL: No h-full here. The dashboard must grow naturally with content.
       On mobile the fixed top-bar (56px) + context-bar (48px) = 104px are 
       accounted for by pt-[104px] on <main> in AppLayout. */
    <div className="flex flex-col flex-1 px-3 py-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-8">
        
        {/* Header Title — compact on mobile */}
        <PageHeader 
          title="Resumen de Vida" 
          description="Tu progreso, estadísticas y logros recientes."
          className="mb-1 md:mb-4"
        />

        {/* 1. Summary Cards — 2x2 grid on mobile, 4 cols on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[40px] md:h-[40px]"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider relative z-10">Hoy</span>
            <span className="text-2xl md:text-3xl font-black text-indigo-600 mt-0.5 relative z-10">{productivity.completedToday}</span>
            <span className="text-[9px] md:text-xs font-bold text-slate-400 mt-0.5 relative z-10 leading-tight">tareas completadas</span>
          </Card>
          
          <Card className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[40px] md:h-[40px]"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider relative z-10">Semana</span>
            <span className="text-2xl md:text-3xl font-black text-indigo-600 mt-0.5 relative z-10">{productivity.completedThisWeek}</span>
            <span className="text-[9px] md:text-xs font-bold text-slate-400 mt-0.5 relative z-10 leading-tight">tareas completadas</span>
          </Card>
          
          <Card variant={productivity.overdue > 0 ? 'alert' : 'default'} className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[40px] md:h-[40px]"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            </div>
            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider relative z-10 ${productivity.overdue > 0 ? 'text-red-500' : 'text-slate-500'}`}>Vencidas</span>
            <span className={`text-2xl md:text-3xl font-black mt-0.5 relative z-10 ${productivity.overdue > 0 ? 'text-red-600' : 'text-slate-600'}`}>{productivity.overdue}</span>
            <span className="text-[9px] md:text-xs font-bold text-slate-400 mt-0.5 relative z-10 leading-tight">tareas atrasadas</span>
          </Card>
          
          <Card className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[40px] md:h-[40px]"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider relative z-10 leading-tight">Tasa de Éxito</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-500 mt-0.5 relative z-10">{productivity.completionRate}%</span>
            <span className="text-[9px] md:text-xs font-bold text-slate-400 mt-0.5 relative z-10 leading-tight">completadas vs totales</span>
          </Card>
        </div>

        {/* 2. Gamification Widget — stacks vertically on mobile, row on md+ */}
        <Card className="flex flex-col items-center gap-4 md:flex-row md:gap-8 bg-indigo-900 text-white border-indigo-800 !p-4 md:!p-6 overflow-hidden">
          
          {/* Level Ring — smaller on mobile */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="100" height="100" className="md:w-[120px] md:h-[120px] transform -rotate-90">
              <circle 
                cx="50" cy="50" r={radius} 
                stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" 
                className="md:[cx:60] md:[cy:60]"
              />
              <circle 
                cx="50" cy="50" r={radius} 
                stroke="#10b981" /* emerald-500 */
                strokeWidth="8" fill="none" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out md:[cx:60] md:[cy:60]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] md:text-xs font-bold text-indigo-300 uppercase tracking-wider">Nivel</span>
              <span className="text-3xl md:text-4xl font-black text-white">{gamification.currentLevel}</span>
            </div>
          </div>
          
          {/* Points info */}
          <div className="flex-1 w-full text-center md:text-left min-w-0">
            <div className="text-xl md:text-2xl font-black mb-1">
              {gamification.totalPoints} <span className="text-indigo-300 font-medium text-base md:text-lg">pts acumulados</span>
            </div>
            <div className="text-sm text-indigo-200">
              Faltan <strong className="text-emerald-400">{gamification.pointsMissing} pts</strong> para el Nivel {gamification.currentLevel + 1}.
            </div>
          </div>

          {/* Streaks */}
          <div className="flex gap-6 border-t md:border-t-0 md:border-l border-indigo-800/50 pt-3 md:pt-0 md:pl-8 w-full md:w-auto justify-center">
            <div className="text-center">
              <div className="text-[10px] md:text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Racha Actual</div>
              <div className="text-3xl md:text-4xl font-black text-amber-400 flex items-center justify-center gap-1">
                <span className="text-xl md:text-2xl">🔥</span> {gamification.currentStreak}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] md:text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Mejor Racha</div>
              <div className="text-3xl md:text-4xl font-black text-slate-300 flex items-center justify-center gap-1 opacity-70">
                <span className="text-xl md:text-2xl">🏆</span> {gamification.longestStreak}
              </div>
            </div>
          </div>
        </Card>

        {/* 3-4. Charts — single column on mobile, 2 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* 3. Weekly Productivity Chart (Custom SVG) */}
          <Card className="flex flex-col !p-4 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 border-b border-slate-100 pb-2">Productividad (Últimos 7 días)</h2>
            <div className="flex-1 min-h-[160px] md:min-h-[200px] flex items-end gap-1 md:gap-2 pt-4 relative">
              {!hasWeeklyData ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <EmptyState 
                    title="Sin Actividad" 
                    description="Completa tareas para ver tu progreso aquí."
                    actionLabel="Ir a Tareas"
                    onAction={() => router.push("/tasks")}
                    className="border-none shadow-none bg-transparent py-4"
                    icon={<span className="text-4xl">📊</span>}
                  />
                </div>
              ) : null}

              {weeklyChart.map((day, idx) => {
                const heightPct = hasWeeklyData ? (day.count / maxWeeklyCount) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 md:gap-2 group relative min-w-0">
                    {hasWeeklyData && (
                      <div className="absolute -top-7 bg-slate-800 text-white text-[10px] md:text-xs py-0.5 px-1.5 md:py-1 md:px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {day.count} tareas
                      </div>
                    )}
                    <div className="w-full bg-slate-50 border-b border-slate-200 flex items-end justify-center relative" style={{ height: '140px' }}>
                      {/* Grid lines if empty to make it look like a chart area */}
                      {!hasWeeklyData && (
                        <>
                          <div className="absolute w-full border-t border-dashed border-slate-200 top-1/4"></div>
                          <div className="absolute w-full border-t border-dashed border-slate-200 top-2/4"></div>
                          <div className="absolute w-full border-t border-dashed border-slate-200 top-3/4"></div>
                        </>
                      )}
                      {hasWeeklyData && (
                        <div 
                          className="w-full bg-indigo-500 transition-all duration-1000 ease-out hover:bg-indigo-400" 
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase truncate">{day.dayName}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 4. Category Distribution */}
          <Card className="flex flex-col !p-4 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 border-b border-slate-100 pb-2">Categorías (Últimos 30 días)</h2>
            <div className="space-y-3 md:space-y-4 flex-1 overflow-y-auto pr-1 relative">
              {categoryChart.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <EmptyState 
                    title="Sin Categorías" 
                    description="Crea tu primera tarea categorizada para ver tu distribución."
                    actionLabel="Crear Tarea"
                    onAction={() => router.push("/tasks")}
                    className="border-none shadow-none bg-transparent py-4"
                    icon={<span className="text-4xl">🏷️</span>}
                  />
                </div>
              ) : (
                categoryChart.map((cat, idx) => {
                  const maxCatCount = Math.max(...categoryChart.map(c => c.count));
                  const widthPct = (cat.count / maxCatCount) * 100;
                  
                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs md:text-sm font-bold gap-2">
                        <span className="text-slate-700 truncate">{cat.categoryName}</span>
                        <span className="text-slate-500 whitespace-nowrap">{cat.count} <span className="text-indigo-600">({cat.totalPoints} pts)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 w-full overflow-hidden">
                        <div className={`h-full ${cat.color} transition-all duration-1000`} style={{ width: `${widthPct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* 5-6. Finance + Contacts — single column on mobile, 2 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          
          {/* Finance Balance Widget */}
          <Card className="flex flex-col !p-4 md:!p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-100 pb-2">
              <h2 className="text-base md:text-lg font-bold text-slate-800">Finanzas (Mes Actual)</h2>
              <Link href="/finance" className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">Ver todo</Link>
            </div>
            <div className="flex flex-col flex-1 justify-center gap-3 md:gap-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 md:pb-3">
                <span className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">Ingresos</span>
                <span className="text-emerald-600 font-black text-lg md:text-xl">+{formatCurrency(financeBalance.income, currency)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2 md:pb-3">
                <span className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">Gastos</span>
                <span className="text-red-500 font-black text-lg md:text-xl">-{formatCurrency(financeBalance.expense, currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 md:pt-2">
                <span className="text-slate-800 font-black text-sm md:text-base uppercase tracking-wider">Balance Neto</span>
                <span className={`font-black text-2xl md:text-3xl ${financeBalance.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                  {formatCurrency(financeBalance.balance, currency)}
                </span>
              </div>
            </div>
          </Card>

          {/* Pending Contacts Widget */}
          <Card className="flex flex-col !p-4 md:!p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-100 pb-2">
              <h2 className="text-base md:text-lg font-bold text-slate-800">Seguimiento de Contactos</h2>
              <Link href="/contacts" className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">Ver todo</Link>
            </div>
            <div className="space-y-3 md:space-y-4 flex-1 overflow-y-auto pr-1 max-h-[300px] md:max-h-[350px] relative">
              {pendingContacts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <EmptyState 
                    title="Al Día" 
                    description="No tienes contactos que requieran seguimiento atrasado."
                    className="border-none shadow-none bg-transparent py-4"
                    icon={<span className="text-4xl">🌟</span>}
                  />
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {pendingContacts.map(contact => (
                    <div key={contact.id} className="flex justify-between items-center p-2 md:p-3 border border-slate-200 hover:bg-slate-50 transition-colors gap-2">
                      <div className="min-w-0">
                        <Link href={`/contacts/${contact.id}`} className="font-bold text-sm md:text-base text-indigo-700 hover:text-indigo-900 transition-colors block truncate">
                          {contact.name}
                        </Link>
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">{contact.relationshipType}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] md:text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 md:px-2 py-0.5 md:py-1 uppercase tracking-wider whitespace-nowrap">
                          Atrasado {contact.daysOverdue}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* 7. Achievements Grid */}
        <Card className="!p-4 md:!p-6">
          <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 border-b border-slate-100 pb-2">Logros</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 max-h-[250px] md:max-h-[500px] overflow-y-auto pr-1">
            {achievements.map((ach) => (
              <div 
                key={ach.id} 
                className={`border p-3 md:p-4 flex flex-col items-center text-center transition-all ${
                  ach.unlocked 
                    ? 'border-emerald-200 bg-emerald-50/30' 
                    : 'border-slate-200 bg-slate-50 opacity-50 grayscale'
                }`}
              >
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">{ach.icon}</div>
                <h3 className={`text-xs md:text-sm font-black mb-1 ${ach.unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                  {ach.title}
                </h3>
                <p className="text-[10px] md:text-xs font-medium text-slate-500 line-clamp-2 md:line-clamp-3 leading-relaxed mb-2">
                  {ach.description}
                </p>
                {ach.unlocked && ach.unlockedAt && (
                  <span className="text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 md:px-2 py-0.5 md:py-1 mt-auto border border-emerald-200">
                    {new Date(ach.unlockedAt).toLocaleDateString()}
                  </span>
                )}
                {!ach.unlocked && (
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 md:px-2 py-0.5 md:py-1 mt-auto border border-slate-300">
                    Bloqueado
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 8. Team Ranking (Conditional) */}
        {teamRanking.isMultiplayer && (
          <Card className="!p-4 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 border-b border-slate-100 pb-2">Ranking del Equipo</h2>
            <div className="overflow-x-auto max-h-[300px] md:max-h-[350px] overflow-y-auto -mx-1">
              <table className="w-full text-left text-xs md:text-sm text-slate-600">
                <thead className="bg-slate-100 text-[10px] md:text-xs uppercase font-black text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-2 md:px-4 py-2 md:py-3">Pos</th>
                    <th className="px-2 md:px-4 py-2 md:py-3">Usuario</th>
                    <th className="px-2 md:px-4 py-2 md:py-3">Lvl</th>
                    <th className="px-2 md:px-4 py-2 md:py-3">Pts</th>
                    <th className="px-2 md:px-4 py-2 md:py-3">🔥</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRanking.ranking.map((row) => (
                    <tr 
                      key={row.userId} 
                      className={`border-b border-slate-100 last:border-0 ${
                        row.isCurrentUser ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-2 md:px-4 py-2 md:py-3 font-black text-slate-900 text-base md:text-lg">
                        {row.position === 1 ? '🥇' : row.position === 2 ? '🥈' : row.position === 3 ? '🥉' : `#${row.position}`}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-800">
                        <span className="truncate block max-w-[100px] md:max-w-none">{row.name}</span>
                        {row.isCurrentUser && <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">(Tú)</span>}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        <span className="bg-slate-200 text-slate-800 px-1.5 md:px-2 py-0.5 md:py-1 font-black text-[10px] md:text-xs uppercase tracking-wider">{row.currentLevel}</span>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 font-black text-indigo-600">{row.totalPoints}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 font-bold text-amber-500">{row.currentStreak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 9. Collaboration Stats */}
        {teamRanking.isMultiplayer && collaborationStats.length > 0 && (
          <Card className="!p-4 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 border-b border-slate-100 pb-2">Top Colaboradores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-h-[350px] overflow-y-auto pr-1">
              {collaborationStats.map((collab, index) => (
                <div key={collab.userId} className="border border-slate-200 bg-slate-50 p-3 md:p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase border border-slate-300 shrink-0 text-sm md:text-base">
                        {collab.image ? <img src={collab.image} alt={collab.name} className="w-full h-full object-cover" /> : collab.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 leading-none text-sm md:text-base truncate">{collab.name}</div>
                        {index === 0 && <div className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-wider mt-1">Colaborador Estrella ⭐</div>}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 md:mt-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Microtareas</span>
                      <span className="text-lg md:text-xl font-black text-slate-700">{collab.completedSubtasks}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bono Colab.</span>
                      <span className="text-lg md:text-xl font-black text-emerald-600">+{collab.collaborationPoints} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 10. Kudos Widget */}
        {(kudoSummary || (publicKudoWall && publicKudoWall.length > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <Card className="flex flex-col !p-4 md:!p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-100 pb-2">
                <h2 className="text-base md:text-lg font-bold text-slate-800">Tus Reconocimientos</h2>
                <Link href="/kudos" className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Ver Panel</Link>
              </div>
              <div className="flex flex-col flex-1 justify-center gap-4 md:gap-6">
                <div className="text-center">
                  <span className="text-4xl md:text-5xl font-black text-indigo-600 block mb-2">
                    {Object.values(kudoSummary?.received || {}).reduce((a, b) => a + b, 0)}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Medallas Recibidas (Total)
                  </span>
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {getKudoOptions().filter(opt => (kudoSummary?.received[opt.type] || 0) > 0).slice(0, 5).map(opt => (
                    <div key={opt.type} className="flex flex-col items-center p-1.5 md:p-2 bg-slate-50 border border-slate-200" title={opt.label}>
                      <span className="text-xl md:text-2xl">{opt.icon}</span>
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-0.5 md:mt-1">x{kudoSummary?.received[opt.type]}</span>
                    </div>
                  ))}
                  {Object.keys(kudoSummary?.received || {}).length === 0 && (
                    <span className="text-xs md:text-sm text-slate-400 italic">Aún no tienes medallas. ¡Sigue colaborando!</span>
                  )}
                </div>
              </div>
            </Card>

            {publicKudoWall && publicKudoWall.length > 0 && (
              <Card className="flex flex-col !p-4 md:!p-6">
                <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-100 pb-2">
                  <h2 className="text-base md:text-lg font-bold text-slate-800">Muro del Equipo</h2>
                  <Link href="/kudos" className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Ver Todos</Link>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 pr-1 max-h-[250px] md:max-h-[300px]">
                  {publicKudoWall.slice(0, 3).map((kudo) => {
                    const opt = getKudoOptions().find(o => o.type === kudo.type);
                    return (
                      <div key={kudo.id} className="p-2 md:p-3 bg-slate-50 border border-slate-200 flex gap-2 md:gap-3 items-start">
                        <div className="text-xl md:text-2xl shrink-0">{opt?.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] md:text-xs text-slate-600 leading-snug">
                            <span className="font-bold text-slate-800">{kudo.fromUser?.name}</span> reconoció a <span className="font-bold text-slate-800">{kudo.toUser?.name}</span>
                          </p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5 md:mt-1">{opt?.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* CTA Button */}
        <div className="flex justify-center pt-4 md:pt-8 pb-4 md:pb-12">
          <Link href="/tasks" className="px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white font-black text-sm md:text-base uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm">
            Ir a mis Tareas →
          </Link>
        </div>

      </div>
    </div>
  );
}
