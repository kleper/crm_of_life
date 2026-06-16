import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast({ type: 'success', message, duration: options?.duration || 2000 }),
  error: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast({ type: 'error', message, duration: options?.duration || 4000 }),
  info: (message: string, options?: { duration?: number }) => useToastStore.getState().addToast({ type: 'info', message, duration: options?.duration || 3000 }),
};
