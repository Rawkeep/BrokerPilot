import { useAIRequest } from '../../hooks/useAIRequest.js';
import { useAIStore } from '../../stores/aiStore.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { AIPromptInput } from './AIPromptInput.jsx';
import { FREEMIUM_DAILY_LIMIT } from '../../../../shared/aiProviders.js';
import { de } from '../../i18n/de.js';

/**
 * AIResponsePanel — Full AI chat test interface.
 * Shows prompt input, message history, loading/error states,
 * and token usage information.
 */
export function AIResponsePanel() {
  const {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    conversations,
    hasApiKey,
  } = useAIRequest();

  const freemiumCount = useAIStore((s) => s.freemiumCount);
  const t = de.pages.aiAgents;

  const freemiumRemaining = Math.max(0, FREEMIUM_DAILY_LIMIT - freemiumCount);

  return (
    <div className="ai-response-panel">
      {/* BYOK / Freemium badge */}
      <div className="ai-response-panel__badge-row">
        {hasApiKey ? (
          <span className="ai-badge ai-badge--byok">{t.byokBadge}</span>
        ) : (
          <span className="ai-badge ai-badge--freemium">
            {t.freemiumBadge.replace('{remaining}', String(freemiumRemaining))}
          </span>
        )}
      </div>

      {/* Prompt input */}
      <AIPromptInput onSend={sendMessage} isLoading={isLoading} />

      {/* Error display */}
      {error && (
        <GlassCard hoverable={false} className="ai-response-panel__error">
          <p className="ai-response-panel__error-text">
            {t.error}: {error}
          </p>
        </GlassCard>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="ai-response-panel__loading">
          <span className="ai-response-panel__loading-pulse">{de.common.loading}</span>
        </div>
      )}

      {/* Message history */}
      {conversations.length > 0 ? (
        <div className="ai-response-panel__messages">
          {conversations.map((msg, idx) => (
            <div
              key={idx}
              className={`ai-message ai-message--${msg.role}`}
            >
              <div className="ai-message__content">{msg.content}</div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading &&
        !error && (
          <GlassCard hoverable={false} className="ai-response-panel__empty">
            <p>{t.noResponse}</p>
          </GlassCard>
        )
      )}

      {/* Token usage */}
      {lastResponse?.usage && (
        <div className="ai-response-panel__usage">
          <span className="ai-response-panel__usage-label">{t.tokenUsage}:</span>
          <span>
            {t.inputTokens}: {lastResponse.usage.inputTokens} | {t.outputTokens}:{' '}
            {lastResponse.usage.outputTokens}
          </span>
        </div>
      )}
    </div>
  );
}
