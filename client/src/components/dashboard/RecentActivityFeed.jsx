import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { de as deFns } from 'date-fns/locale';
import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

const ACTIVITY_ICONS = {
  created: '\ud83d\udfe2',
  stage_change: '\u27a1\ufe0f',
  note: '\ud83d\udcdd',
  edit: '\u270f\ufe0f',
  ai_analysis: '\ud83e\udd16',
  tag_change: '\ud83c\udff7\ufe0f',
};

/**
 * Shows last N activities across all leads.
 * @param {{ activities: Array<{ id: string, type: string, timestamp: string, description: string, leadId: string, leadName: string }> }} props
 */
export function RecentActivityFeed({ activities }) {
  if (!activities?.length) {
    return (
      <GlassCard hoverable={false} className="activity-feed">
        <h3 className="dashboard-section__title">{de.crm.kpis.recentActivity}</h3>
        <p className="dashboard-section__empty">
          {de.crm.kpis.noActivity || 'Keine Aktivitaeten vorhanden'}
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard hoverable={false} className="activity-feed">
      <h3 className="dashboard-section__title">{de.crm.kpis.recentActivity}</h3>
      <div className="activity-feed__list">
        {activities.map((a) => (
          <div key={a.id} className="activity-feed__item">
            <span className="activity-feed__icon">
              {ACTIVITY_ICONS[a.type] || '\u2022'}
            </span>
            <div className="activity-feed__content">
              <Link to={`/pipeline/${a.leadId}`} className="activity-feed__lead-name">
                {a.leadName || 'Unbekannt'}
              </Link>
              <span className="activity-feed__desc">{a.description}</span>
            </div>
            <span className="activity-feed__time">
              {formatDistanceToNow(new Date(a.timestamp), {
                addSuffix: true,
                locale: deFns,
              })}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
