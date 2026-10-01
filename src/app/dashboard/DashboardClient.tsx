"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { getKudoOptions } from "@/lib/kudos";
import { formatCurrency } from "@/lib/currency";
import Icons from "@/components/ui/Icons";
import { createTask, updateTaskStatus } from "@/features/tasks/actions";
import { createTransaction } from "@/features/finance/actions";
import { logInteraction } from "@/features/contacts/actions";

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
  achievements: Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: Date | string | null;
  }>;
  teamRanking: {
    isMultiplayer: boolean;
    ranking: Array<{
      userId: string;
      name: string;
      currentLevel: number;
      totalPoints: number;
      currentStreak: number;
      position: number;
      isCurrentUser: boolean;
    }>;
  };
  pendingContacts: Array<{
    id: string;
    name: string;
    relationshipType: string;
    daysOverdue: number;
  }>;
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
  taskCategories?: Array<{ id: string; name: string }>;
  financeCategories?: Array<{ id: string; name: string; type: string }>;
  assignedTasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    points: number;
    status: string;
    dueDate: string | null;
    dueTime: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    assignedTo: string | null;
    isCreatedByMe: boolean;
    creatorName: string;
    creatorImage: string | null;
    totalSubtasks: number;
    completedSubtasks: number;
  }>;
  tenantMembers?: Array<{
    id: string;
    name: string;
    email: string | null;
    image: string | null;
    role: string;
  }>;
  currentUserId?: string;
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
  currency,
  taskCategories = [],
  financeCategories = [],
  assignedTasks = [],
  tenantMembers = [],
  currentUserId = ""
}: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab State: "focus" (Mi Día) vs "social" (Progreso & Equipo)
  const [activeTab, setActiveTab] = useState<"focus" | "social">("focus");

  // Quick Action Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeType, setFinanceType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Submitting States
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);
  const [checkingInContactId, setCheckingInContactId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // SVG Level Ring Calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gamification.progressPct / 100) * circumference;

  // Weekly Chart Calculations
  const maxWeeklyCount = Math.max(...weeklyChart.map(w => w.count), 1);
  const hasWeeklyData = weeklyChart.some(w => w.count > 0);

  // Helper to show transient feedback toast
  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State for completing a task from the dashboard
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      const res = await updateTaskStatus(taskId, "DONE");
      showFeedback(`✓ Tarea completada ${res ? `(+${res.pointsEarned} pts)` : ""}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      showFeedback("Error al completar la tarea");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const formatTaskDueDate = (dueDateStr: string | null) => {
    if (!dueDateStr) return null;
    const targetDate = new Date(dueDateStr);
    const now = new Date();

    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const diffDays = Math.round((targetDay - todayDay) / oneDay);

    if (diffDays < 0) {
      return {
        label: `Vencida (${Math.abs(diffDays)}d)`,
        badgeClass: "bg-red-100 text-red-800 border-red-200"
      };
    }
    if (diffDays === 0) {
      return {
        label: "Hoy",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-200"
      };
    }
    if (diffDays === 1) {
      return {
        label: "Mañana",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200"
      };
    }

    const formatted = targetDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short"
    });
    return {
      label: formatted,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200"
    };
  };

  // 1-Click Quick Contact Check-in
  const handleQuickCheckIn = async (contactId: string, contactName: string) => {
    try {
      setCheckingInContactId(contactId);
      await logInteraction(contactId, {
        type: "OTRO",
        notes: "Check-in rápido registrado desde el Dashboard"
      });
      showFeedback(`Check-in con ${contactName} registrado (+5 pts)`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError("Error al registrar interacción: " + (err.message || "Intenta nuevamente"));
    } finally {
      setCheckingInContactId(null);
    }
  };

  // Quick Task Creation Handler
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingTask(true);
    setActionError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createTask(formData);
      setIsTaskModalOpen(false);
      showFeedback("Tarea creada exitosamente");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message || "Error al crear la tarea");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Quick Finance Transaction Creation Handler
  const handleCreateFinance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingFinance(true);
    setActionError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const amountVal = parseFloat(formData.get("amount") as string);
    const categoryId = formData.get("categoryId") as string;
    const description = (formData.get("description") as string) || undefined;

    if (isNaN(amountVal) || amountVal <= 0) {
      setActionError("Ingresa un monto válido");
      setIsSubmittingFinance(false);
      return;
    }

    if (!categoryId) {
      setActionError("Selecciona una categoría");
      setIsSubmittingFinance(false);
      return;
    }

    try {
      await createTransaction({
        financeCategoryId: categoryId,
        amount: amountVal,
        description
      });
      setIsFinanceModalOpen(false);
      showFeedback(`Transacción registrada (+2 pts)`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message || "Error al registrar la transacción");
    } finally {
      setIsSubmittingFinance(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-3 py-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* Transient feedback toast */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            type="success"
            duration={4000}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Page Header & Global Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Cockpit de Vida</h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Tu centro de mando operativo: foco diario, triage de relaciones y progreso equilibrado.
            </p>
          </div>

          {/* Segmented View Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("focus")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider min-h-[44px] transition-colors rounded-none cursor-pointer ${
                activeTab === "focus"
                  ? "bg-slate-900 text-white"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <Icons.CheckSquare className="w-4 h-4" />
              <span>Mi Día</span>
              {productivity.overdue > 0 && (
                <span className="bg-red-600 text-white text-xs font-black px-1.5 py-0.5">
                  {productivity.overdue}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("social")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider min-h-[44px] transition-colors rounded-none cursor-pointer ${
                activeTab === "social"
                  ? "bg-slate-900 text-white"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <Icons.Trophy className="w-4 h-4" />
              <span>Progreso & Equipo</span>
              {teamRanking.isMultiplayer && (
                <span className="bg-amber-400 text-amber-950 text-xs font-black px-1.5 py-0.5">
                  #{teamRanking.ranking.find(r => r.isCurrentUser)?.position || 1}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: MI DÍA (Focus Cockpit)                                             */}
        {/* ========================================================================= */}
        {activeTab === "focus" && (
          <div className="space-y-4 md:space-y-6">

            {/* Acciones Rápidas Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 md:p-4 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Acciones Rápidas:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex-1 sm:flex-initial"
                >
                  <Icons.Plus className="w-4 h-4" />
                  <span>Nueva Tarea</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFinanceModalOpen(true)}
                  className="flex-1 sm:flex-initial"
                >
                  <Icons.Wallet className="w-4 h-4" />
                  <span>Registrar Finanza</span>
                </Button>

                <Link href="/tasks" className="hidden lg:inline-flex">
                  <Button variant="ghost" size="sm">
                    <span>Ver Tablero Kanban →</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* 1. Summary Cards (Planar, No Drop-shadows, High Contrast) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Link href="/tasks" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                <Card className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4 border border-slate-200 hover:border-slate-400 transition-colors rounded-none">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icons.Calendar className="w-7 h-7 md:w-10 md:h-10 text-slate-900" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider relative z-10">Hoy</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900 mt-1 relative z-10">{productivity.completedToday}</span>
                  <span className="text-xs font-medium text-slate-500 mt-1 relative z-10">tareas completadas</span>
                </Card>
              </Link>

              <Link href="/tasks" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                <Card className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4 border border-slate-200 hover:border-slate-400 transition-colors rounded-none">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icons.TrendingUp className="w-7 h-7 md:w-10 md:h-10 text-slate-900" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider relative z-10">Semana</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900 mt-1 relative z-10">{productivity.completedThisWeek}</span>
                  <span className="text-xs font-medium text-slate-500 mt-1 relative z-10">tareas acumuladas</span>
                </Card>
              </Link>

              <Link href="/tasks" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
                <Card variant={productivity.overdue > 0 ? "alert" : "default"} className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4 border transition-colors rounded-none">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icons.AlertTriangle className="w-7 h-7 md:w-10 md:h-10 text-red-600" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider relative z-10 ${productivity.overdue > 0 ? "text-red-700" : "text-slate-600"}`}>Vencidas</span>
                  <span className={`text-2xl md:text-3xl font-black mt-1 relative z-10 ${productivity.overdue > 0 ? "text-red-600" : "text-slate-600"}`}>{productivity.overdue}</span>
                  <span className="text-xs font-medium text-slate-500 mt-1 relative z-10">requieren atención</span>
                </Card>
              </Link>

              {/* Tasa de Éxito: cursor-default because it's not a link */}
              <Card className="flex flex-col justify-between relative overflow-hidden group !p-3 md:!p-4 border border-slate-200 cursor-default rounded-none">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icons.Target className="w-7 h-7 md:w-10 md:h-10 text-slate-900" />
                </div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider relative z-10">Tasa de Éxito</span>
                <span className="text-2xl md:text-3xl font-black text-emerald-600 mt-1 relative z-10">{productivity.completionRate}%</span>
                <span className="text-xs font-medium text-slate-500 mt-1 relative z-10">histórico completadas</span>
              </Card>
            </div>

            {/* 2. Gamification Focus & Streak Status */}
            <Card className="flex flex-col items-center gap-4 md:flex-row md:gap-8 bg-white border border-slate-200 !p-4 md:!p-6 overflow-hidden rounded-none">
              {/* Level Ring SVG with standard 100x100 coordinate box */}
              <div className="relative flex items-center justify-center shrink-0 w-[100px] h-[100px] md:w-[110px] md:h-[110px]">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="square"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nivel</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900">{gamification.currentLevel}</span>
                </div>
              </div>

              {/* Points Information */}
              <div className="flex-1 w-full text-center md:text-left min-w-0">
                <div className="text-lg md:text-xl font-black mb-1 text-slate-900">
                  <span>{gamification.totalPoints}</span> <span className="text-slate-600 font-medium text-sm md:text-base">puntos acumulados</span>
                </div>
                <div className="text-xs md:text-sm text-slate-600">
                  Faltan <strong className="text-emerald-700 font-bold">{gamification.pointsMissing} pts</strong> para alcanzar el Nivel {gamification.currentLevel + 1}.
                </div>
                <div className="w-full bg-slate-100 h-2 mt-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${gamification.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Streaks */}
              <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-8 w-full md:w-auto justify-center">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Racha Actual</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-500 flex items-center justify-center gap-1.5">
                    <Icons.Flame className="w-6 h-6 text-amber-500" />
                    <span>{gamification.currentStreak}d</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mejor Racha</div>
                  <div className="text-2xl md:text-3xl font-black text-slate-400 flex items-center justify-center gap-1.5">
                    <Icons.Trophy className="w-6 h-6 text-slate-400" />
                    <span>{gamification.longestStreak}d</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Tareas Asignadas y Pendientes (Cockpit Directo) */}
            <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none bg-white">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Tareas Asignadas y Pendientes</h2>
                  {assignedTasks.length > 0 && (
                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5">
                      {assignedTasks.length}
                    </span>
                  )}
                </div>
                <Link
                  href="/tasks"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                >
                  Ver Tablero
                </Link>
              </div>

              {assignedTasks.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <EmptyState
                    title="Al Día con tus Tareas"
                    description="No tienes tareas pendientes asignadas. Crea una nueva o revisa el tablero general."
                    actionLabel="Crear Tarea"
                    onAction={() => setIsTaskModalOpen(true)}
                    className="border-none shadow-none bg-transparent py-2"
                    icon={<Icons.CheckSquare className="w-8 h-8 text-emerald-600" />}
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assignedTasks.map((t) => {
                    const dateInfo = formatTaskDueDate(t.dueDate);
                    const isCompleting = completingTaskId === t.id;

                    return (
                      <div
                        key={t.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50 transition-colors -mx-2 px-2"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleCompleteTask(t.id)}
                            disabled={isCompleting}
                            title="Completar tarea"
                            aria-label={`Completar tarea: ${t.title}`}
                            className="mt-0.5 w-5 h-5 min-w-[20px] min-h-[20px] border border-slate-300 rounded-none bg-white hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors cursor-pointer"
                          >
                            {isCompleting ? (
                              <span className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent animate-spin inline-block" />
                            ) : null}
                          </button>

                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {t.title}
                            </span>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-200">
                                +{t.points} pts
                              </span>

                              {t.categoryName && (
                                <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                  <span
                                    className={`w-2 h-2 shrink-0 ${t.categoryColor || "bg-slate-400"}`}
                                  />
                                  <span>{t.categoryName}</span>
                                </span>
                              )}

                              {t.totalSubtasks > 0 && (
                                <span className="text-xs font-medium text-slate-500">
                                  {t.completedSubtasks}/{t.totalSubtasks} microtareas
                                </span>
                              )}

                              {!t.isCreatedByMe && (
                                <span className="text-xs font-medium text-slate-500 italic">
                                  Por: {t.creatorName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Due Date & Time Badge */}
                        <div className="flex items-center gap-2 self-start sm:self-center pl-8 sm:pl-0">
                          {dateInfo ? (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 border uppercase tracking-wider ${dateInfo.badgeClass}`}
                            >
                              {dateInfo.label}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5">
                              Sin fecha
                            </span>
                          )}

                          {t.dueTime && (
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Icons.Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t.dueTime}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 4-5. Weekly Productivity & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              
              {/* Weekly Bar Chart (Accessible Labels for Mobile) */}
              <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-slate-900">Productividad Semanal</h2>
                  <span className="text-xs font-medium text-slate-500">Últimos 7 días</span>
                </div>

                <div className="flex-1 min-h-[170px] flex items-end gap-1.5 md:gap-2 pt-6 relative">
                  {!hasWeeklyData ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <EmptyState
                        title="Sin Actividad Reciente"
                        description="Completa tareas diarias para registrar tu progreso en el gráfico."
                        actionLabel="Ir a Tareas"
                        onAction={() => router.push("/tasks")}
                        className="border-none shadow-none bg-transparent py-4"
                        icon={<Icons.Dashboard className="w-8 h-8 text-slate-400" />}
                      />
                    </div>
                  ) : null}

                  {weeklyChart.map((day, idx) => {
                    const heightPct = hasWeeklyData ? (day.count / maxWeeklyCount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
                        {/* Accessible numeric value directly visible above bar */}
                        {hasWeeklyData && (
                          <span className="text-xs font-bold text-slate-700 min-h-[18px]">
                            {day.count > 0 ? day.count : ""}
                          </span>
                        )}

                        <div className="w-full bg-slate-50 border-b border-slate-200 flex items-end justify-center relative h-[120px]">
                          {hasWeeklyData && (
                            <div
                              className="w-full bg-slate-900 transition-all duration-300 hover:bg-indigo-600"
                              style={{ height: `${Math.max(heightPct, day.count > 0 ? 8 : 0)}%` }}
                              title={`${day.dayName}: ${day.count} tareas`}
                            />
                          )}
                        </div>

                        <span className="text-xs font-bold text-slate-600 uppercase truncate mt-1">
                          {day.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Category Distribution */}
              <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-slate-900">Distribución por Categorías</h2>
                  <Link href="/settings/categories" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Gestionar
                  </Link>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {categoryChart.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <EmptyState
                        title="Sin Categorías"
                        description="Asigna categorías a tus tareas para monitorear el balance de áreas de vida."
                        actionLabel="Crear Tarea"
                        onAction={() => setIsTaskModalOpen(true)}
                        className="border-none shadow-none bg-transparent py-2"
                        icon={<Icons.Tag className="w-8 h-8 text-slate-400" />}
                      />
                    </div>
                  ) : (
                    categoryChart.map((cat, idx) => {
                      const maxCatCount = Math.max(...categoryChart.map(c => c.count));
                      const widthPct = (cat.count / maxCatCount) * 100;

                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-bold gap-2">
                            <span className="text-slate-800 truncate">{cat.categoryName}</span>
                            <span className="text-slate-600 whitespace-nowrap">
                              {cat.count} tareas <span className="text-indigo-600 font-medium">({cat.totalPoints} pts)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 w-full overflow-hidden border border-slate-200">
                            <div className={`h-full ${cat.color} transition-all duration-500`} style={{ width: `${widthPct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* 5-6. Finance Balance & Overdue Contacts Triage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              
              {/* Finance Balance Cockpit Card */}
              <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-slate-900">Finanzas del Mes</h2>
                  <Link href="/finance" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Ver Registro
                  </Link>
                </div>

                <div className="flex flex-col flex-1 justify-center gap-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Ingresos</span>
                    <span className="text-emerald-700 font-black text-base md:text-lg">
                      +{formatCurrency(financeBalance.income, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Gastos</span>
                    <span className="text-red-600 font-black text-base md:text-lg">
                      -{formatCurrency(financeBalance.expense, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-900 font-black text-xs md:text-sm uppercase tracking-wider">Balance Neto</span>
                    <span className={`font-black text-xl md:text-2xl ${financeBalance.balance >= 0 ? "text-slate-900" : "text-amber-700"}`}>
                      {formatCurrency(financeBalance.balance, currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setIsFinanceModalOpen(true)}>
                    <Icons.Plus className="w-3.5 h-3.5" />
                    <span>Registrar Transacción</span>
                  </Button>
                </div>
              </Card>

              {/* Overdue Contacts with 1-Click Check-in */}
              <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Seguimiento de Relaciones</h2>
                    {pendingContacts.length > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 border border-red-200">
                        {pendingContacts.length}
                      </span>
                    )}
                  </div>
                  <Link href="/contacts" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Ver Todos
                  </Link>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[280px]">
                  {pendingContacts.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <EmptyState
                        title="Relaciones al Día"
                        description="¡Excelente! No tienes contactos pendientes de seguimiento atrasado."
                        className="border-none shadow-none bg-transparent py-2"
                        icon={<Icons.Star className="w-8 h-8 text-amber-500" />}
                      />
                    </div>
                  ) : (
                    pendingContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-2.5 border border-slate-200 hover:bg-slate-50 transition-colors gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors block truncate"
                          >
                            {contact.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium text-slate-500 uppercase">{contact.relationshipType}</span>
                            <span className="text-xs font-bold text-red-600">
                              · Atrasado {contact.daysOverdue}d
                            </span>
                          </div>
                        </div>

                        {/* 1-Click Actionable Check-in Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={checkingInContactId === contact.id}
                          onClick={() => handleQuickCheckIn(contact.id, contact.name)}
                          className="shrink-0 text-xs font-bold !min-h-[36px]"
                        >
                          {checkingInContactId === contact.id ? (
                            <span className="text-slate-400">Guardando...</span>
                          ) : (
                            <>
                              <Icons.Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Check-in ✓</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PROGRESO & EQUIPO (Social & Gamification)                         */}
        {/* ========================================================================= */}
        {activeTab === "social" && (
          <div className="space-y-4 md:space-y-6">

            {/* Team Leaderboard (Multiplayer) */}
            {teamRanking.isMultiplayer && (
              <Card className="!p-4 md:!p-6 border border-slate-200 rounded-none">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Ranking del Equipo</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Puntos y consistencia de colaboradores en esta organización.</p>
                  </div>
                  <Badge variant="warning">Colaboración</Badge>
                </div>

                <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                  <table className="w-full text-left text-xs md:text-sm text-slate-700">
                    <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Pos</th>
                        <th className="px-3 py-2.5">Usuario</th>
                        <th className="px-3 py-2.5">Nivel</th>
                        <th className="px-3 py-2.5">Puntos</th>
                        <th className="px-3 py-2.5">Racha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamRanking.ranking.map((row) => (
                        <tr
                          key={row.userId}
                          className={`border-b border-slate-100 last:border-0 transition-colors ${
                            row.isCurrentUser ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-3 py-2.5 font-black text-slate-900">
                            {row.position <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 font-black text-xs text-white ${
                                  row.position === 1 ? "bg-amber-500" : row.position === 2 ? "bg-slate-400" : "bg-amber-700"
                                }`}
                              >
                                {row.position}
                              </span>
                            ) : (
                              `#${row.position}`
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-slate-900">{row.name}</span>
                            {row.isCurrentUser && (
                              <span className="ml-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">(Tú)</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 text-xs font-bold uppercase">
                              Lvl {row.currentLevel}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">{row.totalPoints} pts</td>
                          <td className="px-3 py-2.5 font-bold text-amber-600">
                            <span className="inline-flex items-center gap-1">
                              <Icons.Flame className="w-4 h-4 text-amber-500 inline" /> {row.currentStreak}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Top Collaborators */}
            {teamRanking.isMultiplayer && collaborationStats.length > 0 && (
              <Card className="!p-4 md:!p-6 border border-slate-200 rounded-none">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-slate-900">Top Colaboradores en Tareas</h2>
                  <span className="text-xs text-slate-500 font-medium">Soporte inter-equipos</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {collaborationStats.map((collab, index) => (
                    <div key={collab.userId} className="border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase border border-slate-300 shrink-0 text-sm">
                          {collab.image ? (
                            <img src={collab.image} alt={collab.name} className="w-full h-full object-cover" />
                          ) : (
                            collab.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{collab.name}</div>
                          {index === 0 && (
                            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              Colaborador Estrella <Icons.Star className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-500 uppercase">Subtareas</span>
                          <span className="text-base font-bold text-slate-900">{collab.completedSubtasks}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-medium text-slate-500 uppercase">Bono Colab.</span>
                          <span className="text-base font-bold text-emerald-700">+{collab.collaborationPoints} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Vitrina de Logros (Achievements) */}
            <Card className="!p-4 md:!p-6 border border-slate-200 rounded-none">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Vitrina de Logros</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Hitos de consistencia, productividad y disciplina financiera.</p>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {achievements.filter(a => a.unlocked).length} de {achievements.length} desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`border p-3 flex flex-col items-center text-center transition-all ${
                      ach.unlocked
                        ? "border-emerald-300 bg-emerald-50/20"
                        : "border-slate-200 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center mb-2">
                      {ach.unlocked ? (
                        <Icons.Trophy className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <Icons.Target className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <h3 className={`text-xs font-bold mb-1 ${ach.unlocked ? "text-slate-900" : "text-slate-600"}`}>
                      {ach.title}
                    </h3>
                    <p className="text-xs font-normal text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {ach.description}
                    </p>
                    {ach.unlocked ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 mt-auto border border-emerald-200 uppercase">
                        {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : "Logrado"}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 mt-auto border border-slate-300 uppercase">
                        Bloqueado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Kudos & Reconocimientos */}
            {(kudoSummary || (publicKudoWall && publicKudoWall.length > 0)) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                
                {/* Received Kudos Counter */}
                <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h2 className="text-base font-bold text-slate-900">Tus Medallas</h2>
                    <Link href="/kudos" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                      Enviar Reconocimiento
                    </Link>
                  </div>

                  <div className="flex flex-col flex-1 justify-center gap-4 text-center">
                    <div>
                      <span className="text-4xl md:text-5xl font-black text-slate-900 block mb-1">
                        {Object.values(kudoSummary?.received || {}).reduce((a, b) => a + b, 0)}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Medallas Recibidas en este Espacio
                      </span>
                    </div>

                    <div className="flex justify-center gap-2 flex-wrap pt-2">
                      {getKudoOptions().filter(opt => (kudoSummary?.received[opt.type] || 0) > 0).slice(0, 6).map(opt => (
                        <div key={opt.type} className="flex flex-col items-center p-2 bg-slate-50 border border-slate-200" title={opt.label}>
                          <Icons.Star className="w-5 h-5 text-amber-500" />
                          <span className="text-xs font-bold text-slate-800 mt-1">{opt.label}</span>
                          <span className="text-xs font-medium text-slate-500">x{kudoSummary?.received[opt.type]}</span>
                        </div>
                      ))}
                      {Object.keys(kudoSummary?.received || {}).length === 0 && (
                        <span className="text-xs text-slate-500 italic">Aún no tienes medallas en este espacio de trabajo.</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Public Kudo Wall */}
                {publicKudoWall && publicKudoWall.length > 0 && (
                  <Card className="flex flex-col !p-4 md:!p-6 border border-slate-200 rounded-none">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                      <h2 className="text-base font-bold text-slate-900">Muro del Equipo</h2>
                      <Link href="/kudos" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                        Ver Muro Completo
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[260px]">
                      {publicKudoWall.slice(0, 3).map((kudo) => {
                        const opt = getKudoOptions().find(o => o.type === kudo.type);
                        return (
                          <div key={kudo.id} className="p-3 bg-slate-50 border border-slate-200 flex gap-3 items-start">
                            <div className="p-2 bg-white border border-slate-200 shrink-0">
                              <Icons.Trophy className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700 leading-snug">
                                <strong className="text-slate-900 font-bold">{kudo.fromUser?.name}</strong> reconoció a{" "}
                                <strong className="text-slate-900 font-bold">{kudo.toUser?.name}</strong>
                              </p>
                              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mt-0.5">
                                {opt?.label || kudo.type}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: QUICK TASK CREATION                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setActionError(null);
        }}
        title="Crear Nueva Tarea Rápida"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {actionError}
            </div>
          )}

          <Input
            label="Título de la Tarea *"
            name="title"
            required
            placeholder="Ej. Revisar contrato de servicios"
            autoFocus
          />

          <Input
            label="Descripción (opcional)"
            name="description"
            placeholder="Detalles o notas sobre la entrega"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Asignar a"
              name="assignedTo"
              defaultValue={currentUserId}
              options={[
                { value: currentUserId, label: "A mí (Responsable)" },
                ...tenantMembers
                  .filter(m => m.id !== currentUserId)
                  .map(m => ({ value: m.id, label: m.name }))
              ]}
            />

            <Select
              label="Categoría"
              name="categoryId"
              options={[
                { value: "", label: "Sin categoría" },
                ...taskCategories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Puntos"
              name="points"
              type="number"
              defaultValue="10"
              min="1"
              max="100"
            />
            <Input
              label="Fecha Límite"
              name="dueDate"
              type="date"
            />
            <Input
              label="Hora Límite"
              name="dueTime"
              type="time"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsTaskModalOpen(false);
                setActionError(null);
              }}
              disabled={isSubmittingTask}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmittingTask}
            >
              {isSubmittingTask ? "Guardando..." : "Guardar Tarea"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK FINANCE TRANSACTION                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFinanceModalOpen}
        onClose={() => {
          setIsFinanceModalOpen(false);
          setActionError(null);
        }}
        title="Registrar Transacción"
        maxWidth="md"
      >
        <form onSubmit={handleCreateFinance} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {actionError}
            </div>
          )}

          {/* Income vs Expense Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFinanceType("EXPENSE")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                financeType === "EXPENSE"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              - Gasto
            </button>
            <button
              type="button"
              onClick={() => setFinanceType("INCOME")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                financeType === "INCOME"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              + Ingreso
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Monto (${currency}) *`}
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              autoFocus
            />

            <Select
              label="Categoría Financiera *"
              name="categoryId"
              required
              options={[
                { value: "", label: "Selecciona categoría..." },
                ...financeCategories
                  .filter(c => !c.type || c.type === financeType)
                  .map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          <Input
            label="Descripción (opcional)"
            name="description"
            placeholder="Ej. Almuerzo de trabajo o Pago de cliente"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsFinanceModalOpen(false);
                setActionError(null);
              }}
              disabled={isSubmittingFinance}
            >
              Cancelar
            </Button>
            <Button
              variant={financeType === "EXPENSE" ? "destructive" : "primary"}
              type="submit"
              disabled={isSubmittingFinance}
            >
              {isSubmittingFinance ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
