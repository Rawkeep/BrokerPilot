import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Manages document-level theme and broker attributes.
 * Syncs data-theme and data-broker on <html> based on store values.
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // Listen for system preference changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const effectiveTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Apply data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // Apply data-broker attribute
  useEffect(() => {
    if (brokerType) {
      document.documentElement.setAttribute('data-broker', brokerType);
    } else {
      document.documentElement.removeAttribute('data-broker');
    }
  }, [brokerType]);

  return { theme, setTheme, brokerType, effectiveTheme };
}
