import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { KanbanColumn } from './KanbanColumn.jsx';
import { KanbanCard } from './KanbanCard.jsx';
import { LeadForm } from './LeadForm.jsx';
import { LeadFilters } from './LeadFilters.jsx';
import { de } from '../../i18n/de.js';

export function KanbanBoard() {
  const leads = useLeadStore((s) => s.leads);
  const loading = useLeadStore((s) => s.loading);
  const moveLead = useLeadStore((s) => s.moveLead);
  const init = useLeadStore((s) => s.init);
  const brokerType = useSettingsStore((s) => s.brokerType);

  const [activeId, setActiveId] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [defaultStage, setDefaultStage] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    init();
  }, [init]);

  const config = BROKER_TYPES[brokerType];
  const stages = config?.pipelineStages || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getFilteredLeads = useLeadStore((s) => s.getFilteredLeads);

  const filteredLeads = useCallback(() => {
    const activeFilters = { ...filters, brokerType };
    // Only use filter function when filters are active
    const hasFilters = filters.search || filters.stage || filters.priority || filters.dateFrom || filters.dateTo || (filters.tags && filters.tags.length > 0);
    if (hasFilters) {
      return getFilteredLeads(activeFilters);
    }
    return leads.filter((l) => l.brokerType === brokerType);
  }, [leads, brokerType, filters, getFilteredLeads]);

  const allTags = [...new Set(
    leads
      .filter((l) => l.brokerType === brokerType)
      .flatMap((l) => l.tags || [])
  )];

  const getLeadsForStage = useCallback(
    (stageId) => filteredLeads().filter((l) => l.stage === stageId),
    [filteredLeads]
  );

  const totalFilteredCount = filteredLeads().length;
  const hasActiveFilters = filters.search || filters.stage || filters.priority || filters.dateFrom || filters.dateTo || (filters.tags && filters.tags.length > 0);

  function findStageForLead(leadId) {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.stage;
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id;
    const overId = over.id;

    // Determine target stage
    let targetStage = null;

    // Check if over is a column (stage id)
    if (stages.some((s) => s.id === overId)) {
      targetStage = overId;
    } else {
      // Over is another card — find which stage that card is in
      targetStage = findStageForLead(overId);
    }

    if (!targetStage) return;

    const currentStage = findStageForLead(activeLeadId);

    // Validate stage exists
    if (!stages.some((s) => s.id === targetStage)) return;

    if (currentStage !== targetStage) {
      moveLead(activeLeadId, targetStage);
    }
  }

  function handleAddLead(stageId) {
    setEditingLead(null);
    setDefaultStage(stageId);
    setShowLeadForm(true);
  }

  function handleEditLead(lead) {
    setEditingLead(lead);
    setDefaultStage(null);
    setShowLeadForm(true);
  }

  function handleCloseForm() {
    setShowLeadForm(false);
    setEditingLead(null);
    setDefaultStage(null);
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  if (loading) {
    return (
      <div className="kanban-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kanban-skeleton__column" />
        ))}
      </div>
    );
  }

  return (
    <>
      <LeadFilters
        stages={stages}
        allTags={allTags}
        onFilterChange={setFilters}
      />
      {hasActiveFilters && (
        <div className="lead-filters__results-count">
          {de.crm.filters.resultsCount.replace('{count}', totalFilteredCount)}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={getLeadsForStage(stage.id)}
              onAddLead={handleAddLead}
              onEditLead={handleEditLead}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <KanbanCard lead={activeLead} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadForm
        open={showLeadForm}
        onClose={handleCloseForm}
        lead={editingLead}
        brokerType={brokerType}
        defaultStage={defaultStage}
      />
    </>
  );
}
