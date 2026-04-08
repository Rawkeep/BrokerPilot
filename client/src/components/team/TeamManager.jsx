import { useState, useMemo } from 'react';
import { useTeamStore } from '../../stores/teamStore.js';
import { useLeadStore } from '../../stores/leadStore.js';

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', agent: 'Agent' };

const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const MEDALS = ['🥇', '🥈', '🥉'];

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── Mock activity feed ──────────────────────────────────────── */
function generateActivities(members) {
  const actions = [
    (m) => `${m.name} hat einen neuen Lead erstellt`,
    (m) => `${m.name} hat Lead-Analyse gestartet`,
    (m) => `${m.name} hat einen Deal abgeschlossen`,
    (m) => `${m.name} hat 2 neue Leads erstellt`,
    (m) => `${m.name} hat Pipeline-Analyse gestartet`,
    (m) => `${m.name} hat Lead "Firma ABC" abgeschlossen`,
    (m) => `${m.name} hat einen Follow-up geplant`,
    (m) => `${m.name} hat Dokumente hochgeladen`,
    (m) => `${m.name} hat Notiz hinzugefuegt`,
    (m) => `${m.name} hat E-Mail gesendet`,
  ];

  const now = Date.now();
  return Array.from({ length: 10 }, (_, i) => {
    const member = members[i % members.length];
    const action = actions[i % actions.length];
    const ts = new Date(now - i * 47 * 60_000);
    return {
      id: i,
      time: ts.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      text: action(member),
      color: member.color,
    };
  });
}

/* ── Edit Modal ──────────────────────────────────────────────── */
function EditMemberModal({ member, onClose }) {
  const updateMember = useTeamStore((s) => s.updateMember);
  const unassignLead = useTeamStore((s) => s.unassignLead);
  const assignLead = useTeamStore((s) => s.assignLead);
  const leads = useLeadStore((s) => s.leads);

  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState(member.role);
  const [color, setColor] = useState(member.color);

  const availableLeads = useMemo(
    () => leads.filter((l) => !member.assignedLeads.includes(l.id)),
    [leads, member.assignedLeads]
  );

  function handleSave() {
    updateMember(member.id, { name, email, role, color });
    onClose();
  }

  return (
    <div className="team__modal-overlay" onClick={onClose}>
      <div className="team__modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="team__modal-title">Mitglied bearbeiten</h3>

        <label className="team__modal-label">
          Name
          <input className="team__modal-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="team__modal-label">
          E-Mail
          <input className="team__modal-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="team__modal-label">
          Rolle
          <select className="team__modal-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>
        </label>

        <div className="team__modal-label">
          Farbe
          <div className="team__color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`team__color-swatch${c === color ? ' team__color-swatch--active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                type="button"
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {/* Assigned leads */}
        <div className="team__modal-label">
          Zugewiesene Leads ({member.assignedLeads.length})
          <div className="team__assigned-list">
            {member.assignedLeads.length === 0 && (
              <span className="team__assigned-empty">Keine Leads zugewiesen</span>
            )}
            {member.assignedLeads.map((lid) => {
              const lead = leads.find((l) => l.id === lid);
              return (
                <div key={lid} className="team__assigned-item">
                  <span>{lead ? (lead.name || lead.company || lid) : lid}</span>
                  <button
                    className="team__assigned-remove"
                    onClick={() => unassignLead(member.id, lid)}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead assignment dropdown */}
        {availableLeads.length > 0 && (
          <label className="team__modal-label">
            Lead zuweisen
            <select
              className="team__modal-input"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  assignLead(member.id, e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>Lead auswaehlen...</option>
              {availableLeads.map((l) => (
                <option key={l.id} value={l.id}>{l.name || l.company || l.id}</option>
              ))}
            </select>
          </label>
        )}

        <div className="team__modal-actions">
          <button className="glass-button" onClick={onClose} type="button">Abbrechen</button>
          <button className="glass-button glass-button--primary" onClick={handleSave} type="button">Speichern</button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Member Modal ────────────────────────────────────────── */
function AddMemberModal({ onClose }) {
  const addMember = useTeamStore((s) => s.addMember);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  function handleAdd() {
    if (!name.trim()) return;
    addMember({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      role,
      avatar: null,
      color,
      assignedLeads: [],
      stats: { closed: 0, revenue: 0, activeDeals: 0 },
    });
    onClose();
  }

  return (
    <div className="team__modal-overlay" onClick={onClose}>
      <div className="team__modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="team__modal-title">Neues Mitglied</h3>

        <label className="team__modal-label">
          Name
          <input className="team__modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" />
        </label>

        <label className="team__modal-label">
          E-Mail
          <input className="team__modal-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@broker.de" />
        </label>

        <label className="team__modal-label">
          Rolle
          <select className="team__modal-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>
        </label>

        <div className="team__modal-label">
          Farbe
          <div className="team__color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`team__color-swatch${c === color ? ' team__color-swatch--active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                type="button"
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="team__modal-actions">
          <button className="glass-button" onClick={onClose} type="button">Abbrechen</button>
          <button className="glass-button glass-button--primary" onClick={handleAdd} type="button">Hinzufuegen</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main TeamManager ────────────────────────────────────────── */
export function TeamManager() {
  const members = useTeamStore((s) => s.members);
  const removeMember = useTeamStore((s) => s.removeMember);
  const [editingMember, setEditingMember] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // Leaderboard: sorted by revenue desc
  const leaderboard = useMemo(
    () => [...members].sort((a, b) => b.stats.revenue - a.stats.revenue),
    [members]
  );

  const maxRevenue = leaderboard.length > 0 ? leaderboard[0].stats.revenue : 1;

  // Activity feed
  const activities = useMemo(() => generateActivities(members), [members]);

  return (
    <div className="team">
      {/* Header */}
      <div className="team__header">
        <button className="glass-button glass-button--primary" onClick={() => setShowAdd(true)} type="button">
          + Mitglied
        </button>
      </div>

      {/* Leaderboard */}
      <section className="team__leaderboard glass-card">
        <h2 className="team__section-title">Leaderboard</h2>
        <div className="team__leaderboard-list">
          {leaderboard.map((m, i) => (
            <div key={m.id} className="team__leaderboard-row">
              <span className="team__leaderboard-rank">{MEDALS[i] || `${i + 1}.`}</span>
              <div className="team__avatar" style={{ background: m.color }}>
                {getInitials(m.name)}
              </div>
              <div className="team__leaderboard-info">
                <span className="team__leaderboard-name">{m.name}</span>
                <div className="team__leaderboard-stats">
                  <span>{EUR.format(m.stats.revenue)}</span>
                  <span>{m.stats.closed} Deals</span>
                  <span>{m.stats.activeDeals} aktiv</span>
                </div>
                <div className="team__leaderboard-bar">
                  <div
                    className="team__leaderboard-bar-fill"
                    style={{
                      width: `${(m.stats.revenue / maxRevenue) * 100}%`,
                      background: m.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Members */}
      <section className="team__members glass-card">
        <h2 className="team__section-title">Team-Mitglieder</h2>
        <div className="team__members-list">
          {members.map((m) => (
            <div key={m.id} className="team__member-card">
              <div className="team__avatar" style={{ background: m.color }}>
                {getInitials(m.name)}
              </div>
              <div className="team__member-info">
                <span className="team__member-name">{m.name}</span>
                <span className={`team__role-badge team__role-badge--${m.role}`}>
                  {ROLE_LABELS[m.role]}
                </span>
              </div>
              <span className="team__member-leads">{m.assignedLeads.length} Leads</span>
              <div className="team__member-actions">
                <button className="glass-button" onClick={() => setEditingMember(m)} type="button">Bearbeiten</button>
                <button
                  className="glass-button team__member-remove"
                  onClick={() => removeMember(m.id)}
                  type="button"
                  title="Entfernen"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity Feed */}
      <section className="team__activity-feed glass-card">
        <h2 className="team__section-title">Aktivitaets-Feed</h2>
        <div className="team__activity-list">
          {activities.map((a) => (
            <div key={a.id} className="team__activity-item">
              <span className="team__activity-time">{a.time}</span>
              <span className="team__activity-dot" style={{ background: a.color }} />
              <span className="team__activity-text">{a.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {editingMember && (
        <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />
      )}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
