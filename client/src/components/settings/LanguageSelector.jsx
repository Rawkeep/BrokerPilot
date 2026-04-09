import { useLanguage } from '../../i18n/index.js';

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="lang-selector">
      {Object.entries(languages).map(([code, { label, flag }]) => (
        <button
          key={code}
          className={`lang-selector__option${code === language ? ' lang-selector__option--active' : ''}`}
          onClick={() => setLanguage(code)}
          type="button"
        >
          <span className="lang-selector__flag">{flag}</span>
          <span className="lang-selector__label">{label}</span>
        </button>
      ))}
    </div>
  );
}
