import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityTimeline } from '../../client/src/components/crm/ActivityTimeline.jsx';

// Mock date-fns to control relative timestamp output
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'vor 3 Tagen'),
  parseISO: vi.fn((s) => new Date(s)),
}));

vi.mock('date-fns/locale', () => ({
  de: {},
}));

const STAGES = [
  { id: 'anfrage', label: 'Anfrage', order: 0 },
  { id: 'besichtigung', label: 'Besichtigung', order: 1 },
  { id: 'finanzierung', label: 'Finanzierung', order: 2 },
  { id: 'abgeschlossen', label: 'Abgeschlossen', order: 5 },
];

function makeActivity(overrides = {}) {
  return {
    id: overrides.id || `act-${Math.random()}`,
    type: 'note',
    timestamp: '2026-04-01T10:00:00.000Z',
    description: 'Notiz hinzugefügt',
    metadata: {},
    ...overrides,
  };
}

describe('ActivityTimeline', () => {
  it('renders activities in reverse chronological order (newest first)', () => {
    const activities = [
      makeActivity({ id: 'a1', timestamp: '2026-04-01T08:00:00.000Z', description: 'First' }),
      makeActivity({ id: 'a2', timestamp: '2026-04-03T12:00:00.000Z', description: 'Third' }),
      makeActivity({ id: 'a3', timestamp: '2026-04-02T10:00:00.000Z', description: 'Second' }),
    ];

    render(<ActivityTimeline activities={activities} stages={STAGES} />);

    const items = screen.getAllByTestId(/^activity-(?!timeline)/);
    expect(items).toHaveLength(3);

    // The descriptions should appear in the order: Third, Second, First
    const descriptions = items.map((el) =>
      el.querySelector('.activity-timeline__desc')?.textContent
    );
    expect(descriptions).toEqual(['Third', 'Second', 'First']);
  });

  it('shows correct icon/label per activity type', () => {
    const activities = [
      makeActivity({ id: 'c1', type: 'created', description: 'Lead erstellt' }),
      makeActivity({ id: 'c2', type: 'stage_change', description: 'Phase', metadata: { from: 'anfrage', to: 'besichtigung' } }),
      makeActivity({ id: 'c3', type: 'note', description: 'Notiz' }),
      makeActivity({ id: 'c4', type: 'edit', description: 'Bearbeitet' }),
    ];

    render(<ActivityTimeline activities={activities} stages={STAGES} />);

    expect(screen.getByTestId('activity-created')).toBeDefined();
    expect(screen.getByTestId('activity-stage_change')).toBeDefined();
    expect(screen.getByTestId('activity-note')).toBeDefined();
    expect(screen.getByTestId('activity-edit')).toBeDefined();
  });

  it('shows relative timestamps in German', () => {
    const activities = [
      makeActivity({ id: 'ts1', timestamp: '2026-04-05T12:00:00.000Z' }),
    ];

    render(<ActivityTimeline activities={activities} stages={STAGES} />);

    expect(screen.getByText('vor 3 Tagen')).toBeDefined();
  });

  it('shows "von X nach Y" with stage labels for stage_change', () => {
    const activities = [
      makeActivity({
        id: 'sc1',
        type: 'stage_change',
        description: 'Phase: anfrage → besichtigung',
        metadata: { from: 'anfrage', to: 'besichtigung' },
      }),
    ];

    render(<ActivityTimeline activities={activities} stages={STAGES} />);

    const desc = screen.getByTestId('activity-stage_change')
      .querySelector('.activity-timeline__desc');
    expect(desc.textContent).toContain('von Anfrage nach Besichtigung');
  });

  it('renders "Keine Aktivitäten" message for empty activities array', () => {
    render(<ActivityTimeline activities={[]} stages={STAGES} />);

    expect(screen.getByTestId('no-activities')).toBeDefined();
    expect(screen.getByText(/Keine Aktivit/)).toBeDefined();
  });

  it('renders "Keine Aktivitäten" when activities is undefined', () => {
    render(<ActivityTimeline stages={STAGES} />);

    expect(screen.getByTestId('no-activities')).toBeDefined();
  });
});
