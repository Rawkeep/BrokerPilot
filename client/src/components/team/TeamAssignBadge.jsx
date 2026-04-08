import { useTeamStore } from '../../stores/teamStore.js';

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Small inline badge showing the assigned team member for a lead.
 * Props: { leadId }
 * Shows colored dot + initials, or gray "?" if unassigned.
 */
export function TeamAssignBadge({ leadId }) {
  const members = useTeamStore((s) => s.members);
  const assigned = members.find((m) => m.assignedLeads.includes(leadId));

  if (!assigned) {
    return (
      <span className="team-assign team-assign--unassigned" title="Nicht zugewiesen">
        <span className="team-assign__dot" style={{ background: '#9ca3af' }} />
        <span className="team-assign__initials">?</span>
      </span>
    );
  }

  return (
    <span className="team-assign" title={assigned.name}>
      <span className="team-assign__dot" style={{ background: assigned.color }} />
      <span className="team-assign__initials">{getInitials(assigned.name)}</span>
    </span>
  );
}
