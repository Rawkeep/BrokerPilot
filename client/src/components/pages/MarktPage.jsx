import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

export function MarktPage() {
  const t = de.pages.markt;
  return (
    <div>
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      <GlassCard hoverable={false}>
        <p>{t.placeholder}</p>
      </GlassCard>
    </div>
  );
}
