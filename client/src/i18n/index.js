import { useState, useEffect } from 'react';
import { de } from './de.js';
import { en } from './en.js';

const LANGUAGES = {
  de: { label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}', translations: de },
  en: { label: 'English', flag: '\u{1F1EC}\u{1F1E7}', translations: en },
};

function getDefaultLanguage() {
  const stored = localStorage.getItem('brokerpilot-language');
  if (stored && LANGUAGES[stored]) return stored;

  const browserLang = navigator.language?.split('-')[0];
  if (browserLang && LANGUAGES[browserLang]) return browserLang;

  return 'de';
}

let currentLanguage = getDefaultLanguage();
let currentTranslations = LANGUAGES[currentLanguage].translations;

export function setLanguage(lang) {
  if (!LANGUAGES[lang]) return;
  currentLanguage = lang;
  currentTranslations = LANGUAGES[lang].translations;
  localStorage.setItem('brokerpilot-language', lang);
  window.dispatchEvent(new CustomEvent('language-change', { detail: lang }));
}

export function getLanguage() {
  return currentLanguage;
}

export function getLanguages() {
  return LANGUAGES;
}

/**
 * Translation function with nested key support: t('nav.dashboard')
 * Falls back to German if the key is missing in the current language.
 */
export function t(key, replacements = {}) {
  const keys = key.split('.');
  let value = currentTranslations;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to German
      value = de;
      for (const fk of keys) {
        value = value?.[fk];
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  return Object.entries(replacements).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    value
  );
}

/**
 * React hook that triggers re-render on language change.
 */
export function useLanguage() {
  const [lang, setLang] = useState(currentLanguage);

  useEffect(() => {
    const handler = (e) => setLang(e.detail);
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  return { language: lang, setLanguage, t, languages: LANGUAGES };
}
