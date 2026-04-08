import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { GlassCard } from '../ui/GlassCard.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { scoreAllLeads, getScoreColor } from '../../services/leadScoring.js';

const TIER_CONFIG = {
  hot:  { label: 'Hot',  emoji: '🔴' },
  warm: { label: 'Warm', emoji: '🟠' },
  cold: { label: 'Cold', emoji: '⚪' },
};

/**
 * LeadScoringWidget — Dashboard-Widget mit Lead-Scores und Verteilung.
 */
export function LeadScoringWidget() {
  const leads = useLeadStore((s) => s.leads);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const navigate = useNavigate();

  const stages = brokerType ? BROKER_TYPES[brokerType]?.pipelineStages ?? [] : [];

  const scored = useMemo(() => {
    const filtered = brokerType ? leads.filter((l) => l.brokerType === brokerType) : leads;
    return scoreAllLeads(filtered, stages);
  }, [leads, brokerType, stages]);

  const counts = useMemo(() => {
    const c = { hot: 0, warm: 0, cold: 0 };
    scored.forEach((r) => { c[r.tier] += 1; });
    return c;
  }, [scored]);

  const total = scored.length;

  const topLeads = useMemo(() => {
    return scored.filter((r) => r.tier === 'hot' || r.tier === 'warm').slice(0, 5);
  }, [scored]);

  // Aktuelle Stage-Labels ermitteln
  const stageLabel = (stageId) => {
    const s = stages.find((st) => st.id === stageId);
    return s ? s.label : stageId;
  };

  if (total === 0) {
    return (
      <GlassCard hoverable={false} className="lead-scoring">
        <h3 className="lead-scoring__title">🔥 Lead-Scoring</h3>
        <p className="lead-scoring__empty">Keine Leads vorhanden</p>
      </GlassCard>
    );
  }

  const pct = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <GlassCard hoverable={false} className="lead-scoring">
      <h3 className="lead-scoring__title">🔥 Lead-Scoring</h3>

      {/* Tier-Badges */}
      <div className="lead-scoring__tiers">
        {['hot', 'warm', 'cold'].map((tier) => (
          <span key={tier} className={`lead-scoring__tier-badge lead-scoring__tier-badge--${tier}`}>
            {TIER_CONFIG[tier].label} {counts[tier]}
          </span>
        ))}
      </div>

      {/* Top Leads */}
      {topLeads.length > 0 && (
        <div className="lead-scoring__list">
          <h4 className="lead-scoring__list-title">Top Leads</h4>
          {topLeads.map(({ lead, score, tier }) => (
            <button
              key={lead.id}
              type="button"
              className="lead-scoring__item"
              onClick={() => navigate(`/pipeline/lead/${lead.id}`)}
            >
              <span className="lead-scoring__item-emoji">
                {TIER_CONFIG[tier].emoji}
              </span>
              <span className="lead-scoring__item-name">{lead.name}</span>
              <span className="lead-scoring__item-score">{score}/100</span>
              <span className="lead-scoring__item-stage">{stageLabel(lead.stage)}</span>
              <div className="lead-scoring__score-bar">
                <div
                  className="lead-scoring__score-bar-fill"
                  style={{ width: `${score}%`, background: getScoreColor(score) }}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Score-Verteilung */}
      <div className="lead-scoring__distribution">
        <h4 className="lead-scoring__distribution-title">Score-Verteilung</h4>
        {[
          { tier: 'hot',  color: 'var(--color-error)' },
          { tier: 'warm', color: 'var(--color-warning)' },
          { tier: 'cold', color: 'var(--color-text-muted)' },
        ].map(({ tier, color }) => (
          <div key={tier} className="lead-scoring__distribution-row">
            <div className="lead-scoring__distribution-bar">
              <div
                className="lead-scoring__distribution-bar-fill"
                style={{ width: `${pct(counts[tier])}%`, background: color }}
              />
            </div>
            <span className="lead-scoring__distribution-label">
              {TIER_CONFIG[tier].label}: {pct(counts[tier])}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
