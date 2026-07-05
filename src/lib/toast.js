// Global toast system — callable from anywhere (components or plain functions).
import { create } from 'zustand';

let counter = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    const ttl = t.duration || 3800;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, ttl);
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(icon, message, duration) {
  return useToastStore.getState().push({ icon, message, duration });
}
