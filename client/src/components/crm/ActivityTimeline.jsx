import { formatDistanceToNow, parseISO } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import { de } from '../../i18n/de.js';

const ACTIVITY_ICONS = {
  created: '\u2B50',
  stage_change: '\u27A1\uFE0F',
  note: '\u270F\uFE0F',
  edit: '\uD83D\uDD27',
  ai_analysis: '\uD83E\uDD16',
  tag_change: '\uD83C\uDFF7\uFE0F',
};

function formatStageChange(activity, stages) {
  const from = activity.metadata?.from;
  const to = activity.metadata?.to;
  if (!from || !to) return activity.description;

  const fromLabel = stages?.find((s) => s.id === from)?.label || from;
  const toLabel = stages?.find((s) => s.id === to)?.label || to;
  return `Phase ge\u00E4ndert: von ${fromLabel} nach ${toLabel}`;
}

function formatTimestamp(timestamp) {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true, locale: deLocale });
  } catch {
    return timestamp;
  }
}

export function ActivityTimeline({ activities = [], stages = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <p className="activity-timeline__empty" data-testid="no-activities">
        {de.crm.detail.noActivities}
      </p>
    );
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="activity-timeline" data-testid="activity-timeline">
      {sorted.map((activity) => {
        const icon = ACTIVITY_ICONS[activity.type] || '\u2022';
        const description =
          activity.type === 'stage_change'
            ? formatStageChange(activity, stages)
            : activity.description;
        const time = formatTimestamp(activity.timestamp);
        const typeLabel = de.crm.activity[activity.type] || activity.type;

        return (
          <div
            key={activity.id}
            className="activity-timeline__item"
            data-testid={`activity-${activity.type}`}
          >
            <span className="activity-timeline__icon" aria-hidden="true">
              {icon}
            </span>
            <div className="activity-timeline__content">
              <span className="activity-timeline__type">{typeLabel}</span>
              <span className="activity-timeline__desc">{description}</span>
              <span className="activity-timeline__time">{time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
