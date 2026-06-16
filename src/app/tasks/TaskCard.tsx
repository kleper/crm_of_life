"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { calculateTaskProgress } from "@/lib/subtasks";

export default function TaskCard({ task, onClick }: { task: any, onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;
  const progressPercentage = calculateTaskProgress(subtasks);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Evitamos que el drag dispare el click si el mouse se movió (dnd-kit lo gestiona, pero por si acaso)
        if (onClick && !isDragging) onClick();
      }}
    >
      <Card
        variant={isOverdue ? "alert" : "default"}
        noPadding
        className={`p-4 cursor-pointer active:cursor-grabbing hover:border-indigo-400 transition-colors bg-white ${task.status === "DONE" ? "opacity-60" : ""} ${task._isOptimistic ? "opacity-50" : ""}`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-bold text-sm flex gap-1 items-center min-w-0 ${task.status === "DONE" ? 'line-through text-slate-500' : 'text-slate-900'}`}>
            {task.recurringTemplateId && (
              <span className="text-[12px] opacity-70" title="Parte de una serie recurrente">🔁</span>
            )}
            <span className="truncate">{task.title}</span>
          </h3>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {task._recurringCount > 1 && (
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 border border-indigo-200 whitespace-nowrap" title={`${task._recurringCount} instancias pendientes`}>
                🔁 x{task._recurringCount}
              </span>
            )}
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 border border-amber-200 shrink-0">
              +{task.points}
            </span>
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs font-medium text-slate-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Subtasks Progress */}
        {progressPercentage !== null && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Subtareas</span>
              <span className="text-[9px] font-black text-slate-500">{completedSubtasks}/{subtasks.length}</span>
            </div>
            <ProgressBar percentage={progressPercentage} colorClass={completedSubtasks === subtasks.length ? 'bg-emerald-400' : 'bg-indigo-400'} className="h-1" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center mt-auto">
          {task.category && (
            <span 
              className={`text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 ${task.category.color}`}
            >
              {task.category.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border ${
              isOverdue ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
            }`}>
              {isOverdue ? '¡Vencida! ' : 'Vence: '}
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
