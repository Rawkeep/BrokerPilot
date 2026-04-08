import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router';
import clsx from 'clsx';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { de } from '../../i18n/de.js';

const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function CardContent({ lead, onEdit }) {
  return (
    <>
      <div className="kanban-card__header">
        <Link
          to={`/pipeline/${lead.id}`}
          className="kanban-card__name kanban-card__name--link"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {lead.name}
        </Link>
        <GlassBadge variant={lead.priority}>
          {de.crm.priorities[lead.priority] || lead.priority}
        </GlassBadge>
      </div>
      {lead.company && (
        <div className="kanban-card__company">{lead.company}</div>
      )}
      {lead.dealValue != null && lead.dealValue > 0 && (
        <div className="kanban-card__value">{currencyFmt.format(lead.dealValue)}</div>
      )}
      {lead.tags?.length > 0 && (
        <div className="kanban-card__tags">
          {lead.tags.slice(0, 3).map((tag) => (
            <GlassBadge key={tag}>{tag}</GlassBadge>
          ))}
        </div>
      )}
      {onEdit && (
        <button
          type="button"
          className="kanban-card__edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(lead);
          }}
        >
          {de.common.edit}
        </button>
      )}
    </>
  );
}

export function KanbanCard({ lead, overlay = false, onEdit }) {
  if (overlay) {
    return (
      <GlassCard
        className={clsx('kanban-card', 'kanban-card--overlay')}
        hoverable={false}
        data-lead-id={lead.id}
      >
        <CardContent lead={lead} />
      </GlassCard>
    );
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={clsx('kanban-card', isDragging && 'kanban-card--dragging')}
      hoverable={false}
      data-lead-id={lead.id}
      {...attributes}
      {...listeners}
    >
      <CardContent lead={lead} onEdit={onEdit} />
    </GlassCard>
  );
}
