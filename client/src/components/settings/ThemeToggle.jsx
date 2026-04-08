import { useTheme } from '../../hooks/useTheme.js';
import { GlassButton } from '../ui/GlassButton.jsx';
import { de } from '../../i18n/de.js';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = de.settings.theme;

  const options = [
    { value: 'light', label: t.light },
    { value: 'dark', label: t.dark },
    { value: 'system', label: t.system },
  ];

  return (
    <div className="theme-toggle">
      {options.map((opt) => (
        <GlassButton
          key={opt.value}
          variant={theme === opt.value ? 'primary' : 'default'}
          onClick={() => setTheme(opt.value)}
        >
          {opt.label}
        </GlassButton>
      ))}
    </div>
  );
}
