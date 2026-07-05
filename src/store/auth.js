// Zustand auth store, persisted to localStorage.
// Kept intentionally free of any api import to avoid circular deps.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: ({ user, accessToken, refreshToken }) =>
        set((s) => ({
          user: user !== undefined ? user : s.user,
          accessToken: accessToken !== undefined ? accessToken : s.accessToken,
          refreshToken: refreshToken !== undefined ? refreshToken : s.refreshToken,
        })),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthed: () => Boolean(get().accessToken),
      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'stw-auth' }
  )
);
