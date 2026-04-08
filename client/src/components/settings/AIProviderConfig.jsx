import { useAIStore, DEFAULT_MODELS } from '../../stores/aiStore.js';
import { useKeyStore } from '../../stores/keyStore.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

const PROVIDER_DISPLAY = {
  anthropic: 'Anthropic / Claude',
  openai: 'OpenAI / GPT',
  google: 'Google / Gemini',
  mistral: 'Mistral',
  groq: 'Groq',
  openrouter: 'OpenRouter',
};

const PROVIDERS = Object.keys(DEFAULT_MODELS);

/**
 * AIProviderConfig — Provider and model selector for Einstellungen page.
 * Shows all 6 AI providers with connection status (key available or freemium).
 */
export function AIProviderConfig() {
  const selectedProvider = useAIStore((s) => s.selectedProvider);
  const selectedModel = useAIStore((s) => s.selectedModel);
  const setSelectedProvider = useAIStore((s) => s.setSelectedProvider);
  const setSelectedModel = useAIStore((s) => s.setSelectedModel);

  const decryptedKeys = useKeyStore((s) => s.decryptedKeys);
  const sessionUnlocked = useKeyStore((s) => s.sessionUnlocked);

  const t = de.settings.ai;

  const hasKey = sessionUnlocked && !!decryptedKeys[selectedProvider];

  return (
    <GlassCard hoverable={false}>
      <div className="ai-provider-config">
        <p className="ai-provider-config__description">{t.description}</p>

        <div className="ai-provider-config__field">
          <label className="glass-input-label" htmlFor="ai-provider-select">
            {t.provider}
          </label>
          <select
            id="ai-provider-select"
            className="glass-input"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_DISPLAY[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="ai-provider-config__field">
          <label className="glass-input-label" htmlFor="ai-model-input">
            {t.model}
          </label>
          <input
            id="ai-model-input"
            className="glass-input"
            type="text"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          />
        </div>

        <div
          className={`ai-provider-config__status ${
            hasKey
              ? 'ai-provider-config__status--active'
              : 'ai-provider-config__status--freemium'
          }`}
        >
          {hasKey
            ? t.hasKeyHint.replace('{provider}', PROVIDER_DISPLAY[selectedProvider])
            : t.noKeyHint.replace('{provider}', PROVIDER_DISPLAY[selectedProvider])}
        </div>
      </div>
    </GlassCard>
  );
}
