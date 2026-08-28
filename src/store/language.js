// Zustand language store, persisted to localStorage. English (India) is the
// default - nothing changes for anyone who never opens the language
// setting. Mirrors the theme store's pattern (see ./theme.js).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LANGUAGE, RTL_LANGUAGES } from '../i18n/languages.js';

function applyLanguage(code) {
  document.documentElement.setAttribute('lang', code);
  document.documentElement.setAttribute('dir', RTL_LANGUAGES.includes(code) ? 'rtl' : 'ltr');
}

export const useLanguage = create(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,

      setLanguage: (code) => {
        applyLanguage(code);
        set({ language: code });
      },
    }),
    {
      name: 'stw-language',
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.language);
      },
    }
  )
);
