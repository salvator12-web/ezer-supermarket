import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'gigo_lang';

function getInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {
    /* localStorage unavailable — fall back to default */
  }
  return 'en';
}

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const setLanguage = useCallback((next) => {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failures */
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === 'en' ? 'fr' : 'en');
  }, [lang, setLanguage]);

  const t = useCallback(
    (key) => {
      const value = resolve(translations[lang], key);
      if (value === undefined) return resolve(translations.en, key) ?? key;
      return value;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLanguage, toggleLanguage, t }), [lang, setLanguage, toggleLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
