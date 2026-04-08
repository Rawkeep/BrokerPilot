import { Link } from 'react-router';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { useFollowUps } from '../../hooks/useFollowUps.js';

const URGENCY_CONFIG = {
  critical: { label: 'Kritisch', color: 'high', emoji: '🔴' },
  urgent: { label: 'Dringend', color: 'medium', emoji: '🟠' },
  warning: { label: 'Erinnerung', color: 'low', emoji: '🟡' },
};

/**
 * FollowUpWidget — Dashboard widget showing leads that need attention.
 */
export function FollowUpWidget() {
  const { followUps, urgentCount, criticalCount, totalCount } = useFollowUps();

  if (totalCount === 0) {
    return (
      <GlassCard hoverable={false} className="follow-up-widget">
        <h3 className="follow-up-widget__title">Follow-Ups</h3>
        <p className="follow-up-widget__empty">Alle Leads sind aktuell betreut ✓</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard hoverable={false} className="follow-up-widget">
      <div className="follow-up-widget__header">
        <h3 className="follow-up-widget__title">
          Follow-Ups
          {(urgentCount + criticalCount) > 0 && (
            <span className="follow-up-widget__badge">{urgentCount + criticalCount}</span>
          )}
        </h3>
        <span className="follow-up-widget__count">{totalCount} Leads</span>
      </div>

      <div className="follow-up-widget__list">
        {followUps.slice(0, 8).map((item) => {
          const config = URGENCY_CONFIG[item.urgency];
          return (
            <Link
              key={item.lead.id}
              to={`/pipeline/lead/${item.lead.id}`}
              className="follow-up-widget__item"
            >
              <span className="follow-up-widget__emoji">{config.emoji}</span>
              <div className="follow-up-widget__info">
                <span className="follow-up-widget__name">{item.lead.name}</span>
                <span className="follow-up-widget__detail">
                  {item.daysSinceActivity} Tage ohne Aktivitaet
                </span>
              </div>
              <GlassBadge variant={config.color}>{config.label}</GlassBadge>
            </Link>
          );
        })}
      </div>

      {totalCount > 8 && (
        <p className="follow-up-widget__more">
          +{totalCount - 8} weitere Leads benoetigen Aufmerksamkeit
        </p>
      )}
    </GlassCard>
  );
}
