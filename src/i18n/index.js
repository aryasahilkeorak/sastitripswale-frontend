// Minimal in-house i18n - no external library, matches this codebase's
// preference for small, dependency-free stores over heavier frameworks.
// Keys not yet translated for a language fall back to en-IN, then to the
// key itself, so a missing translation never renders blank.
import { useLanguage } from '../store/language.js';
import { translations } from './translations/index.js';
import { DEFAULT_LANGUAGE } from './languages.js';

export function useT() {
  const language = useLanguage((s) => s.language);
  const dict = translations[language] || translations[DEFAULT_LANGUAGE];
  const fallback = translations[DEFAULT_LANGUAGE];
  return (key) => dict[key] ?? fallback[key] ?? key;
}

export { LANGUAGES, DEFAULT_LANGUAGE, RTL_LANGUAGES } from './languages.js';
