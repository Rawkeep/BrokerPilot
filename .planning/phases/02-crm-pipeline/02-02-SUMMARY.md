---
phase: 02-crm-pipeline
plan: 02
status: complete
completed_at: 2026-04-08
---

## Summary

Built the visual Kanban pipeline with drag-and-drop lead management. The Pipeline page now renders a horizontal board with columns for each pipeline stage (determined by broker type), drag-and-drop cards via @dnd-kit, and a modal form for creating/editing leads with broker-type-specific dynamic fields.

## Files Created

- `client/src/components/ui/GlassModal.jsx` — native `<dialog>` modal with glass styling
- `client/src/components/ui/GlassSelect.jsx` — styled `<select>` wrapper following GlassInput pattern
- `client/src/components/ui/GlassBadge.jsx` — pill badge with priority variants (low/medium/high)
- `client/src/styles/kanban.css` — all Kanban board, modal, badge, and form styles (light + dark themes)
- `client/src/components/crm/KanbanCard.jsx` — sortable card with lead info, priority badge, tags, edit button
- `client/src/components/crm/KanbanColumn.jsx` — droppable column with stage label, card list, add button
- `client/src/components/crm/KanbanBoard.jsx` — DndContext with closestCorners, PointerSensor + KeyboardSensor, DragOverlay
- `client/src/components/crm/LeadForm.jsx` — create/edit lead modal with core fields + dynamic broker-type fields

## Files Modified

- `client/src/components/ui/GlassCard.jsx` — added `forwardRef` for dnd-kit ref forwarding
- `client/src/components/pages/PipelinePage.jsx` — replaced placeholder with KanbanBoard + no-broker-type prompt
- `client/src/main.jsx` — added `kanban.css` import
- `client/src/App.jsx` — added `/pipeline/:leadId` redirect route
- `client/src/i18n/de.js` — added `pages.pipeline.noBrokerType`, `pages.pipeline.selectBrokerType`, `crm.kanban.emptyColumn`, `crm.kanban.addLead`

## Dependencies Added

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

## Test Results

All 120 tests pass (10 test files). No regressions.

## Key Decisions

- GlassCard converted to `forwardRef` to support dnd-kit's `setNodeRef` — backward-compatible change
- KanbanCard uses `overlay` prop to skip `useSortable` when rendered inside `DragOverlay` (clone pattern)
- LeadForm reads `BROKER_TYPES[brokerType].leadFields` dynamically to render broker-specific form fields
- Stage validation in `handleDragEnd` checks against `BROKER_TYPES[brokerType].pipelineStages` before calling `moveLead`
- Default stage passed when adding a lead from a column's "+" button
