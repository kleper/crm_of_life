"use client";

import { useState, useOptimistic, useTransition } from "react";
import { DndContext, DragEndEvent, pointerWithin, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { TaskStatus } from "@prisma/client";
import { updateTaskStatus, createTask, GamificationResult } from "@/features/tasks/actions";
import { addPendingMutation } from "@/lib/idb";
import { subscribeToPushNotifications } from "@/lib/pushClient";
import { toast } from "@/lib/toast";
import KanbanColumn from "./KanbanColumn";
import AchievementToast, { Achievement } from "./AchievementToast";
import TaskDetailModal from "./TaskDetailModal";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Input, Select } from "@/components/ui/Input";
import RecurrenceBuilder from "@/components/tasks/RecurrenceBuilder";
import { createRecurringTaskTemplate } from "@/features/tasks/recurring-actions";
import Link from "next/link";

interface TasksClientProps {
  initialTasks: any[];
  initialStats: any;
  categories: any[];
  tenantUsers: any[];
  currentTenantId: string | null;
  currentUserId: string;
}

export default function TasksClient({ initialTasks, initialStats, categories, tenantUsers, currentTenantId, currentUserId }: TasksClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    initialTasks,
    (state: any[], action: any) => {
      if (action.type === 'UPDATE_STATUS') {
        return state.map(t => t.id === action.payload.id ? { ...t, status: action.payload.status } : t);
      }
      if (action.type === 'ADD_TASK') {
        return [action.payload.task, ...state];
      }
      return state;
    }
  );
  
  const [isPending, startTransition] = useTransition();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [viewMode, setViewMode] = useState<"BOARD" | "TODAY">("TODAY");
  const [taskFilter, setTaskFilter] = useState<"ALL" | "CREATED" | "ASSIGNED" | "COLLAB">("ALL");
  const [hideCompleted, setHideCompleted] = useState(true);

  // New Task State
  const [activeTab, setActiveTab] = useState<"DETALLES" | "RUTINA">("DETALLES");
  const [isRecurring, setIsRecurring] = useState(false);
  const [rruleStr, setRruleStr] = useState("");
  const [subtasks, setSubtasks] = useState<{title: string, order: number}[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const todayStr = new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).split(' ')[0]; // Basic fallback, ideally use tenant timezone

  const isToday = (date: Date) => {
    if (!date) return false;
    const dStr = new Date(date).toLocaleString("sv-SE", { timeZone: "America/Bogota" }).split(' ')[0];
    return dStr === todayStr;
  };

  const isOverdue = (date: Date) => {
    if (!date) return false;
    const dStr = new Date(date).toLocaleString("sv-SE", { timeZone: "America/Bogota" }).split(' ')[0];
    return dStr < todayStr;
  };

  const isUpcoming = (date: Date) => {
    if (!date) return false;
    const dStr = new Date(date).toLocaleString("sv-SE", { timeZone: "America/Bogota" }).split(' ')[0];
    return dStr > todayStr;
  };

  // --- Filter by user role ---
  const userFilteredTasks = optimisticTasks.filter(t => {
    if (taskFilter === "CREATED" && t.createdByUserId !== currentUserId) return false;
    if (taskFilter === "ASSIGNED" && t.assignedTo !== currentUserId) return false;
    if (taskFilter === "COLLAB" && !t.collaborators?.some((c: any) => c.userId === currentUserId)) return false;
    return true;
  });

  // --- Board: show ALL pending tasks, but collapse recurring duplicates ---
  // For recurring tasks (same recurringTemplateId), keep only the nearest 
  // pending instance so the board doesn't fill with 30 copies of "Meditar".
  const deduplicateRecurring = (tasks: any[]) => {
    const nonRecurring: any[] = [];
    const byTemplate = new Map<string, any[]>();

    for (const t of tasks) {
      if (t.recurringTemplateId) {
        const existing = byTemplate.get(t.recurringTemplateId) || [];
        existing.push(t);
        byTemplate.set(t.recurringTemplateId, existing);
      } else {
        nonRecurring.push(t);
      }
    }

    // For each template, pick the nearest pending (by dueDate asc), or
    // if all are done, include them all so "Completadas" column shows them.
    const collapsedRecurring: any[] = [];
    byTemplate.forEach((instances) => {
      const pending = instances.filter(t => t.status !== "DONE");
      if (pending.length > 0) {
        // Sort by dueDate asc, nulls last
        pending.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        // Keep the nearest one but annotate how many more are pending
        const representative = { ...pending[0], _recurringCount: pending.length };
        collapsedRecurring.push(representative);
      }
      // Always include completed instances (for the DONE column)
      const done = instances.filter(t => t.status === "DONE");
      collapsedRecurring.push(...done);
    });

    return [...nonRecurring, ...collapsedRecurring];
  };

  const filteredTasks = viewMode === "BOARD" 
    ? deduplicateRecurring(hideCompleted 
        ? userFilteredTasks.filter(t => t.status !== "DONE") 
        : userFilteredTasks)
    : userFilteredTasks;

  const todayTasks = filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "DONE");
  const overdueTasks = filteredTasks.filter(t => t.dueDate && isOverdue(new Date(t.dueDate)) && t.status !== "DONE");

  const upcomingSubtasks = optimisticTasks.flatMap(task => 
    (task.subtasks || [])
      .filter((st: any) => !st.completed && st.dueDate && (isToday(new Date(st.dueDate)) || isOverdue(new Date(st.dueDate))))
      .map((st: any) => ({ subtask: st, parentTask: task }))
  );

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = optimisticTasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    startTransition(async () => {
      addOptimisticTask({ type: 'UPDATE_STATUS', payload: { id: taskId, status: newStatus } });
      try {
        const result = await updateTaskStatus(taskId, newStatus);
        if (result) {
          setStats((prev: any) => ({
            ...prev,
            totalPoints: prev.totalPoints + (newStatus === "DONE" ? result.pointsEarned : -result.pointsEarned),
            currentLevel: result.newLevel,
            currentStreak: newStatus === "DONE" ? prev.currentStreak + 1 : prev.currentStreak 
          }));

          if (result.unlockedAchievements.length > 0) {
            setCurrentAchievement(result.unlockedAchievements[0]);
          } else if (newStatus === "DONE") {
            toast.info(`✓ +${result.pointsEarned} pts ganados 🎉`);
          }
        }
      } catch (error) {
        console.error("Failed to update status", error);
        toast.error("Error al actualizar la tarea");
      }
    });
  };

  const calculateProgress = () => {
    if (!stats) return 0;
    const level = stats.currentLevel;
    const pointsCurrentLevel = Math.pow(level - 1, 2) * 100;
    const pointsNextLevel = Math.pow(level, 2) * 100;
    const progress = ((stats.totalPoints - pointsCurrentLevel) / (pointsNextLevel - pointsCurrentLevel)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <main className="flex flex-col flex-1 bg-slate-50 h-full overflow-hidden">
      <AchievementToast achievement={currentAchievement} onClose={() => setCurrentAchievement(null)} />
      
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col h-full">
        {/* Header and Gamification */}
        <div className="bg-white border-b border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0 relative overflow-hidden">
          <div className="relative z-10 flex flex-row items-center justify-between lg:w-1/3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tareas</h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Organiza tu trabajo y gana puntos.</p>
            </div>
            <Button variant="primary" onClick={() => setIsSheetOpen(true)} className="hidden md:block uppercase tracking-wider text-xs font-bold px-4 py-2 rounded-none shadow-sm whitespace-nowrap">
              + Nueva Tarea
            </Button>
          </div>

          {stats && (
            <div className="relative z-10 flex gap-4 md:gap-6 items-center overflow-x-auto pb-2 md:pb-0 scrollbar-hide bg-slate-50/50 p-3 md:p-4 border border-slate-100 min-w-0">
              <div className="text-center shrink-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Nivel</div>
                <div className="text-2xl md:text-3xl font-black text-indigo-600 leading-none">{stats.currentLevel}</div>
              </div>
              
              <div className="w-[120px] md:w-[200px] shrink-0">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  <span className="text-indigo-600 truncate">{stats.totalPoints} pts</span>
                  <span className="truncate">Meta: {Math.pow(stats.currentLevel, 2) * 100}</span>
                </div>
                <div className="h-1.5 md:h-2 bg-slate-100 w-full border border-slate-200">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${calculateProgress()}%` }}></div>
                </div>
              </div>

              <div className="text-center border-l border-slate-200 pl-4 md:pl-6 shrink-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Racha</div>
                <div className="text-xl md:text-2xl font-black text-amber-500 flex items-center justify-center gap-1 leading-none">
                  🔥 {stats.currentStreak}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-row items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex gap-1 bg-slate-100 p-1 shrink-0">
            <button 
              onClick={() => setViewMode("BOARD")}
              className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === "BOARD" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              📋 Tablero
            </button>
            <button 
              onClick={() => setViewMode("TODAY")}
              className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === "TODAY" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              📅 Agenda
            </button>
            <Link 
              href="/tasks/recurring"
              className="px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors text-slate-500 hover:text-slate-700 flex items-center gap-1"
              title="Rutinas / Tareas Recurrentes"
            >
              🔁 <span className="hidden sm:inline">Rutinas</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === "BOARD" && (
              <label className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-600 cursor-pointer whitespace-nowrap">
                <input 
                  type="checkbox" 
                  checked={hideCompleted} 
                  onChange={(e) => setHideCompleted(e.target.checked)}
                  className="w-3 h-3 accent-indigo-600"
                />
                <span className="hidden sm:inline">Ocultar completadas</span>
                <span className="sm:hidden">Ocultar ✓</span>
              </label>
            )}

            <div className="w-[140px] sm:w-[180px]">
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-xs px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todas las tareas</option>
                <option value="CREATED">Creadas por mí</option>
                <option value="ASSIGNED">Asignadas a mí</option>
                <option value="COLLAB">Colaboraciones</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          {viewMode === "BOARD" ? (
            <div className="flex gap-4 h-full items-stretch overflow-x-auto snap-x snap-mandatory pb-4">
              <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
                <KanbanColumn id="TODO" title="Por Hacer" tasks={filteredTasks.filter(t => t.status === "TODO")} onTaskClick={handleTaskClick} />
                <KanbanColumn id="IN_PROGRESS" title="En Progreso" tasks={filteredTasks.filter(t => t.status === "IN_PROGRESS")} onTaskClick={handleTaskClick} />
                <KanbanColumn id="DONE" title="Completadas" tasks={filteredTasks.filter(t => t.status === "DONE")} onTaskClick={handleTaskClick} />
              </DndContext>
            </div>
          ) : (
            <div className="h-full overflow-y-auto max-w-3xl mx-auto space-y-8 pb-12">
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <section>
                  <h3 className="text-sm font-black text-amber-700 uppercase tracking-wider mb-4 border-b border-amber-200 pb-2 flex items-center gap-2 bg-amber-50 p-2">
                    ⚠ Pendientes ({overdueTasks.length})
                  </h3>
                  <div className="space-y-3">
                    {overdueTasks.slice(0, 5).map(task => (
                      <div key={task.id} onClick={() => handleTaskClick(task)} className="bg-white border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <button 
                            className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-indigo-500 transition-colors shrink-0 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDragEnd({ active: { id: task.id }, over: { id: "DONE" } } as any);
                            }}
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h4>
                            <div className="flex gap-2 text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">
                              <span className="text-amber-600">{new Date(task.dueDate).toLocaleDateString()}</span>
                              {task.dueTime && <span>• {task.dueTime}</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 border border-amber-200 shrink-0">+{task.points}</span>
                      </div>
                    ))}
                    {overdueTasks.length > 5 && (
                      <div className="text-center py-2">
                        <span className="text-xs font-bold text-slate-500 italic">+ {overdueTasks.length - 5} tareas pendientes más</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Today Section */}
              <section>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span>Hoy — {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5">{todayTasks.length}</span>
                </h3>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-300">
                    <p className="text-slate-500 font-medium">
                      {overdueTasks.length === 0 ? "¡Todo al día por hoy! 🎉" : "No hay nuevas tareas para hoy"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map(task => (
                      <div key={task.id} onClick={() => handleTaskClick(task)} className="bg-white border-l-4 border-l-indigo-500 border-t border-r border-b border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <button 
                            className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-indigo-500 transition-colors shrink-0 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDragEnd({ active: { id: task.id }, over: { id: "DONE" } } as any);
                            }}
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h4>
                            <div className="flex gap-2 text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">
                              {task.dueTime ? <span>🕒 {task.dueTime}</span> : <span>Todo el día</span>}
                              {task.categoryId && <span>• {categories.find((c:any) => c.id === task.categoryId)?.name}</span>}
                              {task.recurrenceRule && <span>• 🔁</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 border border-amber-200 shrink-0">+{task.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Upcoming Subtasks Section */}
              {upcomingSubtasks.length > 0 && (
                <section>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                    Microtareas pendientes ({upcomingSubtasks.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingSubtasks.map(({subtask, parentTask}) => (
                      <div key={subtask.id} onClick={() => handleTaskClick(parentTask)} className="bg-slate-50 border border-slate-200 p-3 cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-3 group">
                        <span className="text-indigo-400">📌</span>
                        <div>
                          <h4 className="font-medium text-sm text-slate-800 line-clamp-1">{subtask.title}</h4>
                          <span className="text-[10px] text-slate-500">De: {parentTask.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          categories={categories}
          tenantUsers={tenantUsers}
          isOpen={!!selectedTask} 
          currentUserId={currentUserId}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {}}
        />
      )}

      {/* FAB Mobile for + Nueva Tarea */}
      <div 
        className="fixed md:hidden z-50" 
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)', right: '16px' }}
      >
        <button 
          onClick={() => setIsSheetOpen(true)}
          className="w-14 h-14 rounded-none shadow-lg flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          aria-label="Nueva Tarea"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* New Task Sheet */}
      <Sheet isOpen={isSheetOpen} onClose={() => {
        setIsSheetOpen(false);
        setIsRecurring(false);
        setSubtasks([]);
        setActiveTab("DETALLES");
      }} title="Crear Tarea">
        <form action={async (formData) => {
          if (isRecurring && rruleStr) {
            startTransition(async () => {
              await createRecurringTaskTemplate({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                categoryId: formData.get("categoryId") as string || undefined,
                points: parseInt(formData.get("points") as string || "10", 10),
                rrule: rruleStr,
                startDate: new Date(),
                dueTime: formData.get("dueTime") as string || undefined,
                subtasks: subtasks
              });
              toast.success("Rutina creada exitosamente");
              // Limpiamos los campos pero mantenemos abierto el modal
              setIsRecurring(false);
              setSubtasks([]);
              setRruleStr("");
              // Reseteamos form (opcional, dejamos que el form siga abierto)
            });
            return;
          }
          if (!navigator.onLine) {
            const payload = {
              title: formData.get("title") as string,
              description: formData.get("description") as string,
              categoryId: formData.get("categoryId") as string,
              points: parseInt(formData.get("points") as string || "10", 10),
              dueDate: formData.get("dueDate") as string,
              dueTime: formData.get("dueTime") as string,
            };
            if (currentTenantId) await addPendingMutation("CREATE_TASK", payload, currentTenantId);
            
            // Optimistic update
            const tempTask = {
              id: "temp-" + Date.now(),
              ...payload,
              status: "TODO" as any,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
              createdAt: new Date(),
              updatedAt: new Date(),
              subtasks: []
            } as any;
            
            startTransition(() => {
              addOptimisticTask({ type: 'ADD_TASK', payload: { task: tempTask } });
            });
            alert("Estás offline. La tarea se guardó localmente.");
          } else {
            // Online creation
            startTransition(async () => {
              await createTask(formData);
              toast.success("Tarea creada exitosamente");
              if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                const res = confirm("¿Deseas activar las notificaciones push para recordatorios de tareas?");
                if (res) await subscribeToPushNotifications();
              }
            });
          }
        }} className="flex flex-col h-full">
          
          <div className="flex border-b border-slate-200 mb-6 bg-slate-50 p-1">
            <button 
              type="button"
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === "DETALLES" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveTab("DETALLES")}
            >
              Detalles
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === "RUTINA" ? "bg-white shadow-sm text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveTab("RUTINA")}
            >
              Recurrencia {isRecurring && "✅"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-24">
            {/* CRITICAL: Use hidden instead of conditional rendering so that
                form inputs (title, description, etc.) are always in the DOM.
                Otherwise formData.get("title") returns null when submitting
                from the Rutina tab. */}
            <div className={activeTab !== "DETALLES" ? "hidden" : ""}>
              <div className="flex flex-col gap-5">
                <Input label="Título" type="text" name="title" required placeholder="Ej: Comprar leche" />
                
                <div className="w-full flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Descripción</label>
                  <textarea name="description" className="w-full border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px] resize-y rounded-none transition-all"></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Select 
                    label="Categoría" 
                    name="categoryId" 
                    options={[
                      { value: "", label: "Sin Categoría" },
                      ...categories.map(c => ({ value: c.id, label: c.name }))
                    ]} 
                  />
                  <Input label="Puntos" type="number" name="points" defaultValue={10} min={1} max={100} required />
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 space-y-4">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">Cuándo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha Límite" type="date" name="dueDate" disabled={isRecurring} />
                    <Input label="Hora (Opcional)" type="time" name="dueTime" />
                  </div>
                  {isRecurring && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 border border-amber-200">La fecha base se maneja desde la pestaña Recurrencia.</p>}
                </div>
              </div>
            </div>

            <div className={activeTab !== "RUTINA" ? "hidden" : ""}>
              <div className="flex flex-col gap-6">
                <label className="flex items-center gap-3 p-4 border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isRecurring} 
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600"
                  />
                  <span className="text-sm font-bold text-slate-800">Activar Recurrencia (Rutina)</span>
                </label>
                
                {isRecurring ? (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <RecurrenceBuilder 
                      startDate={new Date()} 
                      onRRuleChange={setRruleStr} 
                    />
                    
                    <div className="bg-slate-50 border border-slate-200 p-5 space-y-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">Checklist Base</h4>
                      <p className="text-xs text-slate-500 font-medium">Estas microtareas se añadirán automáticamente cada vez que se genere la tarea.</p>
                      
                      <div className="flex flex-col gap-2">
                        {subtasks.map((st, i) => (
                          <div key={i} className="flex justify-between items-center text-sm bg-white p-3 border border-slate-200 shadow-sm group">
                            <span className="font-medium text-slate-700">{st.title}</span>
                            <button type="button" onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          label=""
                          type="text" 
                          placeholder="Nueva microtarea..." 
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newSubtaskTitle.trim()) {
                                setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), order: subtasks.length }]);
                                setNewSubtaskTitle("");
                              }
                            }
                          }}
                        />
                        <Button type="button" variant="secondary" onClick={() => {
                          if (newSubtaskTitle.trim()) {
                            setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), order: subtasks.length }]);
                            setNewSubtaskTitle("");
                          }
                        }}>Añadir</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300">
                    <p className="text-sm text-slate-500 font-medium">Activa la casilla superior para configurar repeticiones.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full bg-slate-50 border-t border-slate-200 p-4 sm:p-6 flex justify-end gap-3 z-20">
            <Button type="button" variant="ghost" onClick={() => {
              setIsSheetOpen(false);
              setIsRecurring(false);
              setSubtasks([]);
            }}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isPending}>Guardar Tarea</Button>
          </div>
        </form>
      </Sheet>
    </main>
  );
}
