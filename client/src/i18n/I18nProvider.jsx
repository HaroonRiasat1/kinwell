import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES, isSupported } from './languages.js';
import en from './locales/en.js';
import ur from './locales/ur.js';

const DICTIONARIES = { en, ur };
const STORAGE_KEY = 'kinwell.language';

// The API client reads this so the server can answer in the same language.
let activeLanguage = DEFAULT_LANGUAGE;
export const currentLanguage = () => activeLanguage;

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isSupported(v) ? v : null;
  } catch {
    return null;
  }
};

/** Looks up `key` in the language, falls back to English, then to the key itself; fills {placeholders}. */
export function translate(lang, key, vars) {
  const text = DICTIONARIES[lang]?.[key] ?? DICTIONARIES.en[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text;
}

const I18nContext = createContext(null);

export function I18nProvider({ initialLanguage, children }) {
  const [lang, setLang] = useState(() => initialLanguage ?? readStored() ?? DEFAULT_LANGUAGE);
  activeLanguage = lang;

  useEffect(() => {
    const meta = LANGUAGES[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    if (meta.font && !document.querySelector(`link[data-font="${lang}"]`)) {
      const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: meta.font });
      link.dataset.font = lang;
      document.head.appendChild(link);
    }
  }, [lang]);

  const setLanguage = useCallback((next) => {
    if (!isSupported(next)) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: choice lasts for this visit */
    }
    setLang(next);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      dir: LANGUAGES[lang].dir,
      locale: LANGUAGES[lang].locale,
      setLanguage,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLanguage],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** { t, lang, dir, locale, setLanguage }. Works without a provider (English) so components stay reusable. */
export function useI18n() {
  return (
    useContext(I18nContext) ?? {
      lang: DEFAULT_LANGUAGE,
      dir: 'ltr',
      locale: LANGUAGES.en.locale,
      setLanguage: () => {},
      t: (key, vars) => translate(DEFAULT_LANGUAGE, key, vars),
    }
  );
}

/** A server error in the reader's language when we know its code, else the server's message. */
export function errorText(t, err) {
  const key = err?.code && `errors.${err.code}`;
  const text = key && t(key);
  return text && text !== key ? text : err?.message;
}
