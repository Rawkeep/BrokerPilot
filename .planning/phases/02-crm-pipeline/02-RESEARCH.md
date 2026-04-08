# Phase 2: CRM & Pipeline - Research

**Researched:** 2026-04-08
**Domain:** Client-side CRM with Kanban DnD, IndexedDB persistence, Zustand state
**Confidence:** HIGH

## Summary

Phase 2 builds the core CRM: broker profile configuration, lead CRUD, a visual Kanban pipeline with drag-and-drop, lead detail pages with activity timelines, search/filter, and a KPI dashboard. Everything is client-side with IndexedDB persistence via the existing StorageAdapter.

The main technical decision is the drag-and-drop library for the Kanban board. `@dnd-kit/core` + `@dnd-kit/sortable` (v6.3.1 / v10.0.0) is the clear choice -- battle-tested, actively maintained, accessible, and the dominant React DnD solution after `react-beautiful-dnd` was deprecated. The newer `@dnd-kit/react` (v0.3.2) is pre-1.0 and should be avoided. The existing IndexedDB `storageAdapter` already has a `leads` object store with `id` keyPath, which is the foundation for all lead persistence. The existing `brokerTypes.js` config object needs to be extended with pipeline stage definitions and broker-specific field schemas.

**Primary recommendation:** Use `@dnd-kit/core` + `@dnd-kit/sortable` for Kanban DnD. Extend `brokerTypes.js` with stage/field configs. Build a `leadStore` (Zustand + IndexedDB persistence) as the central data layer. Use Recharts (already in the stack plan) for KPI dashboard charts.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-01 | Broker profile selection configures pipeline stages, fields, AI prompts | Extend `brokerTypes.js` with `pipelineStages` and `leadFields` per type. Settings store already has `brokerType`. |
| CRM-02 | CRUD leads with broker-type-specific fields | `storageAdapter` already has `leads` store. Build Zustand `leadStore` with IndexedDB persistence. Lead data model defined below. |
| CRM-03 | Visual Kanban pipeline with drag-drop between stages | `@dnd-kit/core` + `@dnd-kit/sortable` -- see Standard Stack. Kanban columns = broker-type stages. |
| CRM-04 | Lead detail page with activity timeline | Activity events stored as array on lead record. Timeline component renders events chronologically. Route: `/pipeline/:leadId`. |
| CRM-05 | Search and filter leads by status, broker type, date, tags | Client-side filtering via Zustand selectors over in-memory lead array. IndexedDB `getAll` + JS filter is performant for <10K leads. |
| CRM-06 | KPI dashboard with pipeline value, conversion rate, active deals, recent activity | Computed from lead data in Zustand store. Recharts for visualization. Pure derivation, no separate data store needed. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop primitives | Market leader for React DnD. Accessible, performant, tree-shakeable. react-beautiful-dnd is deprecated. [VERIFIED: npm registry] |
| @dnd-kit/sortable | ^10.0.0 | Sortable lists/columns | Companion to @dnd-kit/core for reordering items within and across containers (Kanban columns). [VERIFIED: npm registry] |
| @dnd-kit/utilities | ^3.2.2 | CSS transform utilities | Helper for applying drag transforms to DOM elements. [VERIFIED: npm registry] |
| recharts | ^3.8.1 | Dashboard KPI charts | Already in project stack plan. Bar/pie/area charts for pipeline analytics. [VERIFIED: npm registry] |

### Already Installed (project dependencies)
| Library | Version | Purpose |
|---------|---------|---------|
| zustand | ^5.0.12 | State management for leadStore, pipelineStore |
| idb | ^8.0.3 | IndexedDB wrapper -- storageAdapter already built |
| date-fns | ^4.1.0 | Date formatting for timeline, German locale |
| uuid | ^13.0.0 | Lead ID generation |
| clsx | ^2.1.1 | Conditional CSS classes |
| react-router | ^7.14.0 | Routing for lead detail page |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core | @dnd-kit/react (v0.3.2) | Newer API but pre-1.0, limited docs/examples, not production-proven. Avoid. |
| @dnd-kit/core | @hello-pangea/dnd (v18.0.1) | Fork of react-beautiful-dnd. Works but fewer features (no multiple drag, collision strategies). dnd-kit is more flexible. |
| @dnd-kit/core | @atlaskit/pragmatic-drag-and-drop | Atlassian's new DnD. Framework-agnostic but lower React ecosystem adoption and more verbose API. |
| recharts | lightweight-charts | lightweight-charts is for financial time-series (candlestick). KPI dashboard needs bar/pie/area -- Recharts is the right tool. |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts
```

## Architecture Patterns

### Recommended Project Structure
```
client/src/
  components/
    crm/
      KanbanBoard.jsx        # DnD context + column layout
      KanbanColumn.jsx        # Single stage column (droppable)
      KanbanCard.jsx          # Lead card (draggable)
      LeadForm.jsx            # Create/edit lead modal
      LeadDetail.jsx          # Full lead detail page
      ActivityTimeline.jsx    # Timeline of events on a lead
      LeadFilters.jsx         # Search + filter bar
    dashboard/
      KPIGrid.jsx             # Dashboard layout
      KPICard.jsx             # Single metric card
      PipelineChart.jsx       # Recharts pipeline funnel/bar
      ConversionChart.jsx     # Conversion rate chart
      RecentActivity.jsx      # Activity feed widget
    ui/
      GlassModal.jsx          # Modal for lead create/edit (new)
      GlassSelect.jsx         # Dropdown for filters (new)
      GlassTag.jsx            # Tag chip for labels (new)
      GlassBadge.jsx          # Status badge (new)
  stores/
    leadStore.js              # Zustand store: leads CRUD, IndexedDB sync
  services/
    storage.js                # Already exists -- extend DB_VERSION for indexes
  shared/
    brokerTypes.js            # Extend with pipelineStages, leadFields
    leadSchema.js             # Lead data model + validation
```

### Pattern 1: Zustand + IndexedDB Async Persistence
**What:** Lead store loads from IndexedDB on init, writes back on every mutation. Uses the existing `createIDBStorage` or direct `storageAdapter` calls.
**When to use:** All lead CRUD operations.
**Example:**
```javascript
// Source: existing storageAdapter pattern in project
import { create } from 'zustand';
import { storageAdapter } from '../services/storage.js';

export const useLeadStore = create((set, get) => ({
  leads: [],
  loading: true,

  // Load all leads from IndexedDB on app start
  async init() {
    const leads = await storageAdapter.getAll('leads');
    set({ leads, loading: false });
  },

  async addLead(lead) {
    await storageAdapter.put('leads', lead);
    set((s) => ({ leads: [...s.leads, lead] }));
  },

  async updateLead(id, updates) {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return;
    const updated = { ...lead, ...updates, updatedAt: new Date().toISOString() };
    await storageAdapter.put('leads', updated);
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? updated : l) }));
  },

  async deleteLead(id) {
    await storageAdapter.delete('leads', id);
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
  },

  // Derived: leads filtered by current broker type + stage
  getLeadsByStage(brokerType, stage) {
    return get().leads.filter(
      (l) => l.brokerType === brokerType && l.stage === stage
    );
  },
}));
```

### Pattern 2: dnd-kit Kanban with Column Containers
**What:** Use `DndContext` with `SortableContext` per column. Drag between columns updates lead stage.
**When to use:** Pipeline Kanban view.
**Example:**
```javascript
// Source: dnd-kit docs + community Kanban patterns
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function KanbanBoard({ stages, leads }) {
  const [activeId, setActiveId] = useState(null);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    // over.id is the target column (stage) or a card in that column
    const newStage = findStageFromDropTarget(over.id);
    if (newStage && newStage !== active.data.current.stage) {
      updateLeadStage(active.id, newStage);
    }
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-columns">
        {stages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage}>
            <SortableContext
              items={leadsForStage(stage.id)}
              strategy={verticalListSortingStrategy}
            >
              {leadsForStage(stage.id).map((lead) => (
                <KanbanCard key={lead.id} lead={lead} />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {activeId ? <KanbanCard lead={findLead(activeId)} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Pattern 3: Broker-Type Configuration Object
**What:** Extend `BROKER_TYPES` with pipeline stages, lead fields, and default values per broker type.
**When to use:** Everywhere broker-specific behavior is needed.
**Example:**
```javascript
// Extend shared/brokerTypes.js
export const BROKER_TYPES = {
  immobilien: {
    label: 'Immobilien',
    defaultPage: '/pipeline',
    navOrder: ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'],
    accentColor: 'immobilien',
    pipelineStages: [
      { id: 'anfrage', label: 'Anfrage', order: 0 },
      { id: 'besichtigung', label: 'Besichtigung', order: 1 },
      { id: 'finanzierung', label: 'Finanzierung', order: 2 },
      { id: 'angebot', label: 'Angebot', order: 3 },
      { id: 'notartermin', label: 'Notartermin', order: 4 },
      { id: 'abgeschlossen', label: 'Abgeschlossen', order: 5 },
    ],
    leadFields: [
      { key: 'objectType', label: 'Objekttyp', type: 'select', options: ['Wohnung', 'Haus', 'Gewerbe', 'Grundstueck'] },
      { key: 'budget', label: 'Budget', type: 'currency', currency: 'EUR' },
      { key: 'location', label: 'Standort', type: 'text' },
      { key: 'sqm', label: 'Flaeche (m2)', type: 'number' },
      { key: 'timeline', label: 'Zeitrahmen', type: 'text' },
    ],
  },
  // ... other types
};
```

### Anti-Patterns to Avoid
- **Storing derived data in IndexedDB:** KPIs (pipeline value, conversion rate) should be computed from leads array in Zustand selectors, never stored separately. Stored derived data gets stale.
- **Separate IndexedDB reads per Kanban column:** Load ALL leads once on init, filter in memory. IndexedDB is async and slow for many small reads.
- **Unbounded activity arrays on lead objects:** Cap activity history at ~100 entries per lead. Older entries can be trimmed.
- **Using DragOverlay without portal:** DragOverlay must render outside column overflow containers to prevent clipping during drag.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop | Custom pointer event handlers | @dnd-kit/core + @dnd-kit/sortable | Accessibility (keyboard DnD, screen readers), touch support, collision detection, scroll during drag -- hundreds of edge cases |
| ID generation | Math.random or Date.now | uuid v13 (already installed) | Collision-free, standard format |
| Date formatting | Manual string concatenation | date-fns with de locale (already installed) | German date formats, relative time ("vor 3 Tagen"), timezone handling |
| Charts | SVG/Canvas manual drawing | Recharts | Responsive, declarative, handles resize/animation |
| CSS class merging | Template literals with ternaries | clsx (already installed) | Cleaner, handles falsy values, standard pattern |

**Key insight:** The entire DnD problem space (pointer events, touch events, keyboard navigation, collision detection, scroll containers, drag overlays, accessibility announcements) is massive. dnd-kit handles all of this. A hand-rolled solution would take weeks and miss accessibility entirely.

## Broker-Type Pipeline Definitions

These pipeline stage definitions are based on standard broker workflows in the DACH region. [ASSUMED -- based on financial services domain knowledge]

### Immobilien (Real Estate)
| Stage ID | Label (DE) | Description |
|----------|-----------|-------------|
| anfrage | Anfrage | Initial inquiry received |
| besichtigung | Besichtigung | Property viewing scheduled/completed |
| finanzierung | Finanzierung | Financing check/pre-approval |
| angebot | Angebot | Offer submitted |
| notartermin | Notartermin | Notary appointment (legally binding) |
| abgeschlossen | Abgeschlossen | Deal closed |

### Versicherung (Insurance)
| Stage ID | Label (DE) | Description |
|----------|-----------|-------------|
| kontakt | Erstkontakt | First contact / inquiry |
| bedarfsanalyse | Bedarfsanalyse | Needs analysis |
| angebot | Angebot | Insurance offer/quote |
| antrag | Antrag | Application submitted |
| police | Police | Policy issued |
| abgeschlossen | Abgeschlossen | Deal closed |

### Finanz (Finance & Banking)
| Stage ID | Label (DE) | Description |
|----------|-----------|-------------|
| kontakt | Erstkontakt | First contact |
| beratung | Beratung | Advisory consultation |
| analyse | Analyse | Financial analysis |
| angebot | Angebot | Product offer |
| abschluss | Abschluss | Contract signing |
| abgeschlossen | Abgeschlossen | Deal closed |

### Krypto (Crypto)
| Stage ID | Label (DE) | Description |
|----------|-----------|-------------|
| interesse | Interesse | Initial interest |
| kyc | KYC-Pruefung | Know-Your-Customer verification |
| portfolio | Portfolio-Planung | Portfolio planning |
| investment | Investment | Investment execution |
| monitoring | Monitoring | Active monitoring |
| abgeschlossen | Abgeschlossen | Position closed/settled |

### Investment-Banking
| Stage ID | Label (DE) | Description |
|----------|-----------|-------------|
| akquise | Akquise | Deal sourcing |
| duediligence | Due Diligence | Due diligence phase |
| bewertung | Bewertung | Valuation |
| verhandlung | Verhandlung | Negotiation |
| signing | Signing | Contract signing |
| closing | Closing | Transaction closing |

## Lead Data Model

```javascript
/**
 * Lead record stored in IndexedDB 'leads' store.
 * keyPath: 'id'
 */
const leadSchema = {
  // Core fields (all broker types)
  id: 'uuid',                    // UUID v4, generated on create
  brokerType: 'string',          // 'immobilien' | 'krypto' | 'finanz' | 'versicherung' | 'investment'
  stage: 'string',               // Current pipeline stage ID (from broker type config)
  stageOrder: 'number',          // Order within stage (for sorting in Kanban column)

  // Contact info
  name: 'string',                // Lead name (person or company)
  email: 'string|null',          // Email address
  phone: 'string|null',          // Phone number
  company: 'string|null',        // Company name

  // Financial
  dealValue: 'number|null',      // Estimated deal value in EUR (for KPI calculations)
  budget: 'string|null',         // Budget range or specific amount

  // Metadata
  tags: 'string[]',              // Custom tags for filtering
  notes: 'string',               // Free-text notes
  priority: 'string',            // 'low' | 'medium' | 'high'

  // Broker-type-specific fields stored as flat object
  customFields: {                // Dynamic fields defined by broker type config
    // immobilien: { objectType, location, sqm, timeline }
    // krypto: { asset, exchange, riskProfile }
    // versicherung: { versicherungsart, laufzeit, schadenhistorie }
    // finanz: { produkttyp, anlagesumme, risikoklasse }
    // investment: { dealSize, sector, transactionType }
  },

  // Activity timeline
  activities: [
    {
      id: 'uuid',
      type: 'string',            // 'created' | 'stage_change' | 'note' | 'ai_analysis' | 'edit'
      timestamp: 'ISO8601',
      description: 'string',     // Human-readable description (German)
      metadata: {},              // Type-specific data (e.g., { from: 'anfrage', to: 'besichtigung' })
    }
  ],

  // Timestamps
  createdAt: 'ISO8601',
  updatedAt: 'ISO8601',
};
```

## KPI Calculation Patterns

All KPIs are derived from the leads array in memory. No separate storage needed.

```javascript
// Zustand selectors for KPI dashboard
function computeKPIs(leads, brokerType) {
  const typed = leads.filter((l) => !brokerType || l.brokerType === brokerType);

  return {
    // Total pipeline value: sum of dealValue for non-closed leads
    pipelineValue: typed
      .filter((l) => l.stage !== 'abgeschlossen')
      .reduce((sum, l) => sum + (l.dealValue || 0), 0),

    // Conversion rate: closed / total (all time)
    conversionRate: typed.length > 0
      ? typed.filter((l) => l.stage === 'abgeschlossen').length / typed.length
      : 0,

    // Active deals: non-closed leads count
    activeDeals: typed.filter((l) => l.stage !== 'abgeschlossen').length,

    // Leads per stage: for funnel chart
    perStage: stages.map((s) => ({
      stage: s.label,
      count: typed.filter((l) => l.stage === s.id).length,
      value: typed.filter((l) => l.stage === s.id)
        .reduce((sum, l) => sum + (l.dealValue || 0), 0),
    })),

    // Recent activity: last 20 events across all leads, sorted by timestamp
    recentActivity: typed
      .flatMap((l) => l.activities.map((a) => ({ ...a, leadId: l.id, leadName: l.name })))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20),
  };
}
```

## Search & Filter with IndexedDB

**Performance approach:** Load ALL leads into Zustand on app init. Filter in JavaScript memory. IndexedDB is the persistence layer, not the query engine.

**Why this works:** A broker dashboard will have <10,000 leads in a local-first app. Filtering 10K objects in JS takes <1ms. IndexedDB cursors/indexes would be slower due to async overhead per record.

**Implementation:**
```javascript
// Filter function -- pure JS, no IndexedDB queries
function filterLeads(leads, filters) {
  return leads.filter((lead) => {
    if (filters.brokerType && lead.brokerType !== filters.brokerType) return false;
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = `${lead.name} ${lead.email} ${lead.company} ${lead.notes}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filters.tags?.length) {
      if (!filters.tags.some((t) => lead.tags.includes(t))) return false;
    }
    if (filters.dateFrom) {
      if (new Date(lead.createdAt) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      if (new Date(lead.createdAt) > new Date(filters.dateTo)) return false;
    }
    if (filters.priority && lead.priority !== filters.priority) return false;
    return true;
  });
}
```

**IndexedDB upgrade needed:** The current DB_VERSION is 1. If indexes are desired for future optimization (e.g., index on `brokerType` or `stage`), bump to version 2 in the `upgrade` callback. However, indexes are NOT needed for v1 given the in-memory filter approach.

## Activity Timeline Data Model

Activities are stored as an array on each lead record. This avoids a separate IndexedDB store and keeps data co-located.

**Activity types:**
| Type | When Created | Metadata |
|------|-------------|----------|
| `created` | Lead created | `{}` |
| `stage_change` | Lead moved to new stage | `{ from: 'anfrage', to: 'besichtigung' }` |
| `note` | User adds a note | `{ content: '...' }` |
| `edit` | Lead fields edited | `{ fields: ['budget', 'name'] }` |
| `ai_analysis` | AI agent runs on lead (Phase 5) | `{ agentType: 'qualifier', resultId: '...' }` |
| `tag_change` | Tags added/removed | `{ added: [...], removed: [...] }` |

**Display pattern:** Reverse chronological list. Each entry shows icon (by type), timestamp (relative via date-fns `formatDistanceToNow` with `{ locale: de }`), and description.

## Common Pitfalls

### Pitfall 1: DragOverlay Clipping
**What goes wrong:** Dragged card gets clipped by column overflow:hidden or overflow:auto.
**Why it happens:** The DragOverlay renders inside a scrollable container.
**How to avoid:** Render `<DragOverlay>` as a direct child of `<DndContext>`, outside the column container. DragOverlay uses a portal by default in dnd-kit.
**Warning signs:** Card disappears or gets cut off during drag.

### Pitfall 2: IndexedDB Async Init Race Condition
**What goes wrong:** Components render before leads are loaded from IndexedDB, showing empty state briefly then flashing content.
**Why it happens:** IndexedDB reads are async; Zustand store starts with `leads: []`.
**How to avoid:** Set `loading: true` initially. Show skeleton/loading state until `init()` completes. Call `init()` from a top-level `useEffect` or route loader.
**Warning signs:** Flash of empty content on page load.

### Pitfall 3: Stale Closure in DnD Handlers
**What goes wrong:** Drag-end handler uses stale lead data because dnd-kit caches the handler reference.
**Why it happens:** Closure captures old state.
**How to avoid:** Use `active.data.current` to pass fresh data with the drag item, or use Zustand's `get()` inside the handler (not the selector value).
**Warning signs:** Lead moves to wrong stage or data gets lost after drag.

### Pitfall 4: Activity Array Unbounded Growth
**What goes wrong:** Leads with many edits accumulate hundreds of activity entries, slowing IndexedDB writes.
**Why it happens:** Every edit pushes to the array with no cap.
**How to avoid:** Cap at 100-200 activities per lead. Trim oldest on insert. This is a local-first app -- historical audit is less critical.
**Warning signs:** Sluggish save operations on heavily-edited leads.

### Pitfall 5: Missing Keyboard DnD Accessibility
**What goes wrong:** Kanban is mouse-only, keyboard users cannot move leads between stages.
**Why it happens:** dnd-kit provides keyboard support via `KeyboardSensor` but it must be explicitly configured.
**How to avoid:** Always include `KeyboardSensor` alongside `PointerSensor` in `useSensors()`. Provide ARIA labels on columns and cards.
**Warning signs:** Cannot tab to cards or use arrow keys to move them.

## Code Examples

### dnd-kit Sensor Setup (Keyboard + Pointer)
```javascript
// Source: dnd-kit docs pattern
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // prevent accidental drags
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

### GlassModal Component Pattern
```javascript
// New UI component following existing Glass design system
import clsx from 'clsx';
import { useEffect, useRef } from 'react';

export function GlassModal({ open, onClose, title, children, className }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={clsx('glass-modal', className)}
      onClose={onClose}
    >
      <div className="glass-modal__header">
        <h2>{title}</h2>
        <button className="glass-button" onClick={onClose}>x</button>
      </div>
      <div className="glass-modal__content">{children}</div>
    </dialog>
  );
}
```

### Recharts KPI Bar Chart
```javascript
// Source: Recharts docs pattern
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function PipelineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="stage" />
        <YAxis />
        <Tooltip
          formatter={(value) => new Intl.NumberFormat('de-DE', {
            style: 'currency', currency: 'EUR'
          }).format(value)}
        />
        <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core | 2022 (rbd deprecated) | rbd no longer maintained, dnd-kit is the standard |
| localStorage for data | IndexedDB via idb | Project decision | 5MB localStorage limit too small for lead data with activities |
| Redux for CRM state | Zustand | 2023+ trend | Much less boilerplate, same capabilities, fits single-dev MVP |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pipeline stages per broker type are representative of DACH broker workflows | Broker-Type Pipeline Definitions | Stages may need renaming/reordering per user feedback. LOW risk -- configurable anyway. |
| A2 | Broker-specific lead fields (objectType for Immobilien, versicherungsart for Versicherung, etc.) are the right fields | Lead Data Model customFields | Users may want different fields. MEDIUM risk -- but customFields pattern allows easy extension. |
| A3 | <10K leads per user in a local-first app | Search & Filter section | If exceeded, in-memory filtering may need optimization. Very LOW risk for v1. |
| A4 | 100-200 activity cap per lead is sufficient | Pitfall 4 | Power users might want full history. LOW risk -- can increase later. |

## Open Questions

1. **Lead import from existing systems?**
   - What we know: No CSV import in v1 scope (it's in PROD-02, v2).
   - What's unclear: Should we design the lead schema with import/export in mind?
   - Recommendation: Use standard field names that map easily to CSV headers. No action needed now.

2. **Recharts theme integration with Glassmorphism?**
   - What we know: Recharts supports custom colors via props and CSS variables.
   - What's unclear: Whether glass-bg with backdrop-filter plays well as chart container background.
   - Recommendation: Wrap charts in GlassCard. Use `var(--color-accent)` for chart colors. Test early.

3. **Lead detail as separate page vs. slide-over panel?**
   - What we know: CRM-04 says "lead detail page" suggesting full page route.
   - What's unclear: Whether a slide-over panel would be better UX (see lead without losing Kanban context).
   - Recommendation: Full page at `/pipeline/:leadId` as specified. Slide-over can be added later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.3 |
| Config file | `/Users/z_rkb/Downloads/BrokerPilot/vite.config.js` (vitest section) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-01 | Broker type config returns correct stages/fields | unit | `npx vitest run tests/stores/brokerTypes.test.js -t "broker config"` | Wave 0 |
| CRM-02 | Lead CRUD (create, read, update, delete) | unit | `npx vitest run tests/stores/leadStore.test.js -t "CRUD"` | Wave 0 |
| CRM-03 | Drag-drop updates lead stage | integration | `npx vitest run tests/components/KanbanBoard.test.js` | Wave 0 |
| CRM-04 | Activity timeline renders events | unit | `npx vitest run tests/components/ActivityTimeline.test.js` | Wave 0 |
| CRM-05 | Filter leads by status/type/date/tags | unit | `npx vitest run tests/stores/leadStore.test.js -t "filter"` | Wave 0 |
| CRM-06 | KPI computations are correct | unit | `npx vitest run tests/stores/kpiHelpers.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/stores/leadStore.test.js` -- covers CRM-02, CRM-05
- [ ] `tests/stores/kpiHelpers.test.js` -- covers CRM-06
- [ ] `tests/components/KanbanBoard.test.js` -- covers CRM-03
- [ ] `tests/components/ActivityTimeline.test.js` -- covers CRM-04
- [ ] `tests/shared/brokerTypes.test.js` -- covers CRM-01

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- no auth in v1 |
| V3 Session Management | No | N/A -- local-first app |
| V4 Access Control | No | N/A -- single user |
| V5 Input Validation | Yes | Validate lead form inputs -- max lengths, required fields, numeric ranges. Use defensive checks (not Zod in v1 client-only, simple validation functions). |
| V6 Cryptography | No | N/A -- no crypto in CRM phase (keys handled in Phase 1) |

### Known Threat Patterns for Client-Side CRM

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via lead name/notes | Tampering | React auto-escapes JSX. Never use dangerouslySetInnerHTML with user content. |
| IndexedDB data tampering | Tampering | Client-side app -- user owns their data. No mitigation needed for v1. |
| Large payload DoS (huge notes) | Denial of Service | Cap text fields (notes: 5000 chars, name: 200 chars) |

## Sources

### Primary (HIGH confidence)
- npm registry: @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0, @dnd-kit/utilities@3.2.2 [VERIFIED]
- npm registry: @dnd-kit/react@0.3.2 (pre-1.0, not recommended) [VERIFIED]
- npm registry: @hello-pangea/dnd@18.0.1 [VERIFIED]
- npm registry: recharts@3.8.1 [VERIFIED]
- Project codebase: storageAdapter, settingsStore, brokerTypes.js, GlassCard/Button/Input [VERIFIED: local files]

### Secondary (MEDIUM confidence)
- [react-beautiful-dnd deprecation issue](https://github.com/atlassian/react-beautiful-dnd/issues/2672) -- confirmed deprecated
- [Top 5 DnD Libraries for React 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) -- dnd-kit recommended
- [LogRocket Kanban with dnd-kit](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/) -- implementation patterns

### Tertiary (LOW confidence)
- Pipeline stage definitions per broker type [ASSUMED: domain knowledge, not verified with DACH brokers]
- Broker-specific lead fields [ASSUMED: domain knowledge]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- npm versions verified, deprecation status confirmed, project dependencies cross-checked
- Architecture: HIGH -- patterns follow existing project conventions (Zustand + storageAdapter), dnd-kit Kanban is well-documented
- Pitfalls: HIGH -- well-known issues with dnd-kit overlays, IndexedDB async, closure stale state
- Broker domain (stages/fields): LOW -- based on general financial services knowledge, not verified with actual DACH brokers

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain, 30 days)
