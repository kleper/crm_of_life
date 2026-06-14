"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { pauseRecurringTaskTemplate, resumeRecurringTaskTemplate, deleteRecurringTaskTemplate } from "@/features/tasks/recurring-actions";

export default function RecurringTasksClient({ initialTemplates }: { initialTemplates: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handlePause = (id: string, isActive: boolean) => {
    startTransition(async () => {
      if (isActive) {
        await pauseRecurringTaskTemplate(id);
      } else {
        await resumeRecurringTaskTemplate(id);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta plantilla? Las tareas generadas anteriormente NO serán eliminadas.")) {
      startTransition(async () => {
        await deleteRecurringTaskTemplate(id);
      });
    }
  };

  if (!initialTemplates.length) {
    return (
      <div className="bg-white border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-4 rounded-none">
        <div className="text-4xl">🔁</div>
        <h3 className="text-lg font-bold text-slate-800">Aún no tienes tareas recurrentes</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Crea rutinas que se repitan automáticamente — perfecto para hábitos diarios o tareas semanales.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {initialTemplates.map(template => (
        <Card key={template.id} noPadding className={`bg-white transition-opacity ${!template.isActive ? 'opacity-60' : ''}`}>
          <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{template.title}</h3>
                {!template.isActive && <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 border border-amber-200">Pausada</span>}
                {template.category && <span className="text-[10px] font-black uppercase bg-slate-100 px-1.5 border border-slate-200">{template.category.name}</span>}
              </div>
              {template.description && <p className="text-xs text-slate-500 mb-2">{template.description}</p>}
              <div className="flex items-center gap-1 text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 inline-flex border border-indigo-100">
                🔁 {template.humanizedRRule}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase">
                {template._count.generatedTasks} tareas pendientes generadas
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-end items-start md:items-end">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={isPending}
                onClick={() => handlePause(template.id, template.isActive)}
              >
                {template.isActive ? "Pausar" : "Reanudar"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:bg-red-50"
                disabled={isPending}
                onClick={() => handleDelete(template.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
