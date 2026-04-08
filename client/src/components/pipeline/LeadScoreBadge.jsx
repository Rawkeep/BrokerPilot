import { useMemo } from 'react';
import { calculateLeadScore, getScoreTier } from '../../services/leadScoring.js';

const TIER_EMOJI = { hot: '🔴', warm: '🟡', cold: '⚪' };

/**
 * LeadScoreBadge — Kompakte Inline-Anzeige des Lead-Scores.
 *
 * @param {{ lead: object, stages: Array }} props
 */
export function LeadScoreBadge({ lead, stages }) {
  const { score, tier } = useMemo(
    () => calculateLeadScore(lead, stages),
    [lead, stages],
  );

  return (
    <span className={`lead-score-badge lead-score-badge--${tier}`}>
      <span className="lead-score-badge__dot">{TIER_EMOJI[tier]}</span>
      <span className="lead-score-badge__value">{score}</span>
    </span>
  );
}
