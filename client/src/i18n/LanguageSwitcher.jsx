import { LANGUAGES } from './languages.js';
import { useI18n } from './I18nProvider.jsx';

/** Pill buttons listing each language in its own script, so anyone can find theirs. */
export function LanguageSwitcher({ onChange }) {
  const { lang, setLanguage, t } = useI18n();
  return (
    <div role="group" aria-label={t('language.choose')} className="kw-langswitch">
      {Object.entries(LANGUAGES).map(([code, meta]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => {
            setLanguage(code);
            onChange?.(code);
          }}
        >
          {meta.label}
        </button>
      ))}
    </div>
  );
}
