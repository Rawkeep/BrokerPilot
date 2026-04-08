import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { KanbanCard } from './KanbanCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { de } from '../../i18n/de.js';

export function KanbanColumn({ stage, leads, onAddLead, onEditLead }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const leadIds = leads.map((l) => l.id);

  return (
    <div
      ref={setNodeRef}
      className={clsx('kanban-column', isOver && 'kanban-column--over')}
    >
      <div className="kanban-column__header">
        <span className="kanban-column__title">{stage.label}</span>
        <GlassBadge>{leads.length}</GlassBadge>
      </div>

      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="kanban-column__body">
          {leads.length === 0 && (
            <div className="kanban-column__empty">
              {de.crm.kanban?.emptyColumn || 'Keine Leads'}
            </div>
          )}
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onEdit={onEditLead} />
          ))}
        </div>
      </SortableContext>

      <div className="kanban-column__footer">
        <GlassButton onClick={() => onAddLead(stage.id)}>
          + {de.crm.kanban?.addLead || 'Lead hinzufuegen'}
        </GlassButton>
      </div>
    </div>
  );
}
