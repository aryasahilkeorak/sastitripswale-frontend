// Shared unread-notifications count, so the Navbar's badge (avatar, bell,
// "Notifications" menu item) updates instantly the moment something is
// marked read/cleared anywhere in the app, instead of waiting for the
// Navbar's own ~60s poll to catch up.
import { create } from 'zustand';

export const useNotifStore = create((set) => ({
  unread: 0,
  setUnread: (unread) => set({ unread: Math.max(0, unread) }),
  decrement: (by = 1) => set((s) => ({ unread: Math.max(0, s.unread - by) })),
}));
