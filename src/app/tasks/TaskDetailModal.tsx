"use client";

import { useState, useTransition, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { updateTask, addSubtask, toggleSubtask, deleteSubtask, deleteTask, updateSubtaskDueDate, assignTaskCollaborators, assignSubtask } from "@/features/tasks/actions";
import { getTaskCollaborationSummary } from "@/features/tasks/queries";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { calculateTaskProgress } from "@/lib/subtasks";
import { TaskStatus } from "@prisma/client";
import { toast } from "@/lib/toast";
import { Toast } from "@/components/ui/Toast";
import SendKudoModal from "@/components/kudos/SendKudoModal";

function Avatar({ name, image, size = "md" }: { name: string, image?: string | null, size?: "sm" | "md" }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const sizeClass = size === "sm" ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`rounded-none bg-slate-200 text-slate-700 flex items-center justify-center font-bold ${sizeClass} overflow-hidden border border-slate-300`} title={name}>
      {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : initial}
    </div>
  );
}

export default function TaskDetailModal({ task, categories, tenantUsers = [], isOpen, onClose, onUpdated, currentUserId }: any) {
  const [isPending, startTransition] = useTransition();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [collabSummary, setCollabSummary] = useState<any[]>([]);
  const [showKudoToast, setShowKudoToast] = useState(false);
  const [isKudoModalOpen, setIsKudoModalOpen] = useState(false);

  const [selectedCollabIds, setSelectedCollabIds] = useState<string[]>(
    task?.collaborators?.map((c: any) => c.userId) || []
  );

  useEffect(() => {
    if (task?.id && isOpen) {
      setSelectedCollabIds(task?.collaborators?.map((c: any) => c.userId) || []);
      getTaskCollaborationSummary(task.id).then(setCollabSummary).catch(console.error);
    }
  }, [task, isOpen]);

  if (!task) return null;

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;
  const progressPercentage = calculateTaskProgress(subtasks);

  const taskCollaborators = tenantUsers.filter((tu: any) => selectedCollabIds.includes(tu.user.id));

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const handleUpdateField = async (field: string, value: any) => {
    const data = {
      title: task.title,
      description: task.description,
      categoryId: task.categoryId,
      points: task.points,
      dueDate: task.dueDate,
      status: task.status,
      [field]: value
    };
    await updateTask(task.id, data);
    toast.success("✓ Guardado");
    if (onUpdated) onUpdated();
  };

  const debouncedUpdateText = useDebouncedCallback(async (field: string, value: string) => {
    startTransition(async () => {
      await handleUpdateField(field, value);
    });
  }, 500);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    startTransition(async () => {
      await addSubtask(task.id, newSubtaskTitle);
      setNewSubtaskTitle("");
      toast.success("Microtarea agregada");
      if (onUpdated) onUpdated();
    });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const subtask = subtasks.find((s: any) => s.id === subtaskId);
    const wasCompleted = subtask?.completed;

    startTransition(async () => {
      await toggleSubtask(subtaskId);
      if (onUpdated) onUpdated();
      
      // Mostrar Toast si acaba de completarla y hay otros colaboradores
      if (!wasCompleted && taskCollaborators.length > 1) {
        setShowKudoToast(true);
      } else if (!wasCompleted) {
        toast.success("Microtarea completada");
      }
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    startTransition(async () => {
      await deleteSubtask(subtaskId);
      toast.success("Microtarea eliminada");
      if (onUpdated) onUpdated();
    });
  };

  const handleDeleteTask = () => {
    if (confirm("¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.")) {
      startTransition(async () => {
        await deleteTask(task.id);
        toast.success("Tarea eliminada");
        if (onUpdated) onUpdated();
        onClose();
      });
    }
  };

  const handleToggleCollab = (userId: string) => {
    let newIds = [...selectedCollabIds];
    if (newIds.includes(userId)) {
      newIds = newIds.filter(id => id !== userId);
    } else {
      newIds.push(userId);
    }
    setSelectedCollabIds(newIds);
  };

  const handleSaveCollabs = () => {
    startTransition(async () => {
      await assignTaskCollaborators(task.id, selectedCollabIds);
      setIsAssigning(false);
      if (onUpdated) onUpdated();
    });
  };

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} title="Detalle de Tarea">
        <div className="flex flex-col h-full">
        
        <div className="flex-1 overflow-y-auto pr-2 pb-24 space-y-6">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <Input 
            label="Título" 
            type="text" 
            name="title" 
            value={title} 
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedUpdateText("title", e.target.value);
            }} 
            required 
          />
          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Descripción</label>
            <textarea 
              name="description" 
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                debouncedUpdateText("description", e.target.value);
              }}
              className="w-full border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
            ></textarea>
          </div>
        </div>

        {/* Colaboradores Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Colaboradores</h3>
            <Button type="button" variant="ghost" className="text-xs" onClick={() => setIsAssigning(!isAssigning)}>
              {isAssigning ? "Cerrar" : "+ Asignar"}
            </Button>
          </div>
          
          {isAssigning && (
            <div className="border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2">
              <span className="text-xs text-slate-500 mb-1">Selecciona los miembros del equipo:</span>
              <div className="flex flex-wrap gap-2">
                {tenantUsers.map((tu: any) => {
                  const isSelected = selectedCollabIds.includes(tu.user.id);
                  return (
                    <button
                      type="button"
                      key={tu.user.id}
                      onClick={() => handleToggleCollab(tu.user.id)}
                      className={`flex items-center gap-2 px-2 py-1 text-sm border transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Avatar name={tu.user.name || "Usuario"} image={tu.user.image} size="sm" />
                      {tu.user.name}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end mt-2">
                <Button type="button" variant="secondary" onClick={handleSaveCollabs} disabled={isPending}>Guardar Colaboradores</Button>
              </div>
            </div>
          )}

          {!isAssigning && taskCollaborators.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {taskCollaborators.map((tu: any) => (
                <div key={tu.user.id} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-2 py-1">
                  <Avatar name={tu.user.name || "Usuario"} image={tu.user.image} size="sm" />
                  <span className="text-xs font-medium text-slate-700">{tu.user.name}</span>
                </div>
              ))}
            </div>
          )}
          {!isAssigning && taskCollaborators.length === 0 && (
            <p className="text-xs text-slate-400 italic">No hay colaboradores asignados.</p>
          )}
        </div>

        {/* Properties */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select 
              label="Estado" 
              name="status" 
              defaultValue={task.status}
              onChange={(e) => startTransition(() => handleUpdateField("status", e.target.value))}
              options={[
                { value: "TODO", label: "Por Hacer" },
                { value: "IN_PROGRESS", label: "En Progreso" },
                { value: "DONE", label: "Completada" }
              ]} 
            />
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              El progreso de microtareas es informativo. Cambia el estado manualmente.
            </p>
          </div>
          <Select 
            label="Categoría" 
            name="categoryId" 
            defaultValue={task.categoryId || ""}
            onChange={(e) => startTransition(() => handleUpdateField("categoryId", e.target.value))}
            options={[
              { value: "", label: "Sin Categoría" },
              ...categories.map((c: any) => ({ value: c.id, label: c.name }))
            ]} 
          />
          <Input 
            label="Puntos" 
            type="number" 
            name="points" 
            defaultValue={task.points} 
            onChange={(e) => debouncedUpdateText("points", e.target.value)}
            min={1} max={100} required 
          />
          <Input 
            label="Fecha Límite" 
            type="date" 
            name="dueDate" 
            defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
            onChange={(e) => startTransition(() => handleUpdateField("dueDate", e.target.value))}
          />
          <Input 
            label="Hora Límite" 
            type="time" 
            name="dueTime" 
            defaultValue={task.dueTime || ""}
            onChange={(e) => startTransition(() => handleUpdateField("dueTime", e.target.value))}
          />
        </div>

        <hr className="border-slate-200" />

        {/* Subtasks */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Microtareas</h3>
            {subtasks.length > 0 && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200">
                {completedSubtasks}/{subtasks.length}
              </span>
            )}
          </div>
          
          {progressPercentage !== null && (
            <ProgressBar percentage={progressPercentage} colorClass="bg-emerald-500" />
          )}

          <div className="flex flex-col gap-2 mt-2">
            {subtasks.map((st: any) => {
              const isOverdue = st.dueDate && new Date(st.dueDate) < new Date() && !st.completed;
              // find assigned user
              const assignedUser = tenantUsers.find((tu: any) => tu.user.id === st.assignedToUserId)?.user;
              const completedUser = tenantUsers.find((tu: any) => tu.user.id === st.completedByUserId)?.user;

              return (
                <div key={st.id} className="group flex flex-col gap-2 p-2 border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <input 
                        type="checkbox" 
                        checked={st.completed} 
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 cursor-pointer accent-emerald-500"
                        disabled={isPending}
                      />
                      <span className={`text-sm truncate flex-1 ${st.completed ? 'line-through text-slate-400' : 'text-slate-700'} ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        {st.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {st.completed && completedUser && (
                        <div title={`Completado por ${completedUser.name}`} className="opacity-75">
                          <Avatar name={completedUser.name} image={completedUser.image} size="sm" />
                        </div>
                      )}
                      <input 
                        type="date"
                        defaultValue={st.dueDate ? new Date(st.dueDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => {
                          startTransition(async () => {
                            await updateSubtaskDueDate(st.id, e.target.value || null);
                            if (onUpdated) onUpdated();
                          });
                        }}
                        className={`text-xs border-none bg-transparent p-0 outline-none cursor-pointer ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-400 hover:text-slate-600'}`}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleDeleteSubtask(st.id)}
                        disabled={isPending}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Selector de Asignación */}
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Asignado:</span>
                    <select
                      className="text-xs border border-slate-200 bg-white p-1 outline-none text-slate-600"
                      value={st.assignedToUserId || ""}
                      onChange={(e) => {
                        startTransition(async () => {
                          await assignSubtask(st.id, e.target.value || null);
                          if (onUpdated) onUpdated();
                        });
                      }}
                      disabled={isPending}
                    >
                      <option value="">Nadie</option>
                      {taskCollaborators.map((tu: any) => (
                        <option key={tu.user.id} value={tu.user.id}>{tu.user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2">
            <Input 
              label=""
              type="text" 
              placeholder="+ Agregar microtarea..." 
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddSubtask} disabled={isPending || !newSubtaskTitle.trim()}>
              Añadir
            </Button>
          </div>
        </div>

        {/* Aporte de colaboradores (Solo visible si hay >=1 subtask y >=2 colaboradores) */}
        {subtasks.length > 0 && collabSummary.length >= 2 && (
          <>
            <hr className="border-slate-200" />
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aporte del Equipo</h3>
              <div className="flex flex-col gap-2">
                {collabSummary.map((collab: any) => (
                  <div key={collab.userId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar name={collab.name} image={collab.image} size="sm" />
                      <span className="text-slate-700">{collab.name}</span>
                    </div>
                    <div className="flex items-center gap-2 w-1/2">
                      <div className="flex-1 h-2 bg-slate-100 border border-slate-200 overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${collab.percentage}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-10 text-right">{collab.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <hr className="border-slate-200" />

        </div>

        <div className="absolute bottom-0 left-0 w-full bg-slate-50 border-t border-slate-200 p-4 sm:p-6 flex justify-between z-20">
          <Button type="button" variant="ghost" onClick={handleDeleteTask} className="text-red-600 hover:bg-red-50 hover:text-red-700" disabled={isPending}>
            Eliminar
          </Button>
          <div className="flex gap-3">
            <span className="text-xs text-slate-400 flex items-center">{isPending ? "● Guardando..." : "✓ Al día"}</span>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cerrar</Button>
          </div>
        </div>

        </div>
      </Sheet>

    {showKudoToast && (
      <Toast 
        message="¡Bien hecho! ¿Quieres reconocer a alguien de tu equipo por su ayuda?"
        type="success"
        duration={8000}
        onClose={() => setShowKudoToast(false)}
        action={
          <div className="flex gap-2 items-center mt-2">
            <div className="flex -space-x-2 mr-2">
              {taskCollaborators.filter((tu: any) => tu.user.id !== currentUserId).slice(0, 3).map((tu: any) => (
                <div key={tu.user.id} className="relative z-10 inline-block rounded-full ring-2 ring-white">
                   <Avatar name={tu.user.name} image={tu.user.image} size="sm" />
                </div>
              ))}
            </div>
            <Button size="sm" onClick={() => {
              setShowKudoToast(false);
              setIsKudoModalOpen(true);
            }}>
              Enviar Reconocimiento
            </Button>
          </div>
        }
      />
    )}

    {isKudoModalOpen && (
      <SendKudoModal
        isOpen={isKudoModalOpen}
        onClose={() => setIsKudoModalOpen(false)}
        tenantUsers={tenantUsers}
        currentUserId={currentUserId}
        relatedTaskId={task.id}
      />
    )}
    </>
  );
}
