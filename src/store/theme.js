// Zustand theme store, persisted to localStorage. Dark is the default —
// light is opt-in. index.html has a small inline script that reads the
// same persisted value before first paint, so there's no flash of the
// wrong theme on reload.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useTheme = create(
  persist(
    (set, get) => ({
      theme: 'dark',

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'stw-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
