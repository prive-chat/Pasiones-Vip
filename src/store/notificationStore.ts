import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'progress';

interface Toast {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  progress?: number;
  duration?: number;
}

interface NotificationStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (toast.type !== 'progress' && (toast.duration !== 0)) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 5000);
    }

    return id;
  },
  updateToast: (id, updates) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
