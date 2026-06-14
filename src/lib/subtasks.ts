import { Subtask } from "@prisma/client";

export function calculateTaskProgress(subtasks: Subtask[]): number | null {
  if (!subtasks || subtasks.length === 0) {
    return null; // Null indicates no progress bar should be shown
  }
  
  const completedCount = subtasks.filter(s => s.completed).length;
  return Math.round((completedCount / subtasks.length) * 100);
}
