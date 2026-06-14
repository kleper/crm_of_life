"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskStatus } from "@prisma/client";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: any[];
  onTaskClick?: (task: any) => void;
}

const columnColors = {
  TODO: "border-t-slate-400 bg-slate-50",
  IN_PROGRESS: "border-t-indigo-400 bg-indigo-50/30",
  DONE: "border-t-emerald-400 bg-emerald-50/30",
};

export default function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const baseStyle = columnColors[id] || "border-t-slate-400 bg-slate-50";

  return (
    <div className={`snap-start shrink-0 flex flex-col w-[85vw] md:w-auto md:flex-1 min-w-[280px] md:min-w-[300px] border border-slate-200 border-t-4 p-4 ${baseStyle} transition-colors ${isOver ? 'ring-2 ring-indigo-300' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h2>
        <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-200">{tasks.length}</span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 flex flex-col gap-3 min-h-[200px]`}
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center opacity-60">
            <span className="text-2xl mb-2 text-slate-400">📥</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sin tareas</span>
            <span className="text-xs text-slate-400 mt-1">Arrastra una tarea aquí</span>
          </div>
        )}
      </div>
    </div>
  );
}
