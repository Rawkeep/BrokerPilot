import { useState } from 'react';
import { useSessionUnlock, useEncryptKey } from '../../hooks/useCrypto.js';
import { useKeyStore } from '../../stores/keyStore.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassInput } from '../ui/GlassInput.jsx';
import { de } from '../../i18n/de.js';

const PROVIDERS = ['Anthropic', 'OpenAI', 'Google', 'Mistral', 'Groq', 'OpenRouter'];

export function KeyManager() {
  const { sessionUnlocked, decryptedKeys, unlockSession } = useSessionUnlock();
  const { storeKey } = useEncryptKey();
  const encryptedKeys = useKeyStore((s) => s.encryptedKeys);

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [apiKey, setApiKey] = useState('');
  const [savePin, setSavePin] = useState('');

  const t = de.settings.keys;

  const handleUnlock = async () => {
    setPinError('');
    try {
      await unlockSession(pin);
      setPin('');
    } catch {
      setPinError(t.wrongPin);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey || !savePin) return;
    await storeKey(selectedProvider.toLowerCase(), apiKey, savePin);
    setApiKey('');
    setSavePin('');
  };

  if (!sessionUnlocked) {
    const hasKeys = Object.keys(encryptedKeys).length > 0;

    return (
      <GlassCard hoverable={false}>
        <div className="key-manager">
          <p>{t.description}</p>
          {hasKeys ? (
            <div className="key-manager__unlock">
              <GlassInput
                type="password"
                placeholder={t.pinPlaceholder}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                error={pinError}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              <GlassButton variant="primary" onClick={handleUnlock}>
                {t.unlock}
              </GlassButton>
            </div>
          ) : (
            <p>{t.noKeys}</p>
          )}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard hoverable={false}>
      <div className="key-manager">
        <div className="key-manager__badge key-manager__badge--active">
          {t.sessionActive}
        </div>

        <div className="key-manager__providers">
          {PROVIDERS.map((provider) => {
            const key = provider.toLowerCase();
            const hasKey = !!decryptedKeys[key];
            return (
              <div key={provider} className="key-manager__provider-row">
                <span>{provider}</span>
                <span className={`key-manager__status ${hasKey ? 'key-manager__status--unlocked' : ''}`}>
                  {hasKey ? t.unlocked : t.locked}
                </span>
              </div>
            );
          })}
        </div>

        <div className="key-manager__add">
          <h4>{t.addKey}</h4>
          <select
            className="glass-input"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <GlassInput
            type="password"
            placeholder={t.apiKeyPlaceholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <GlassInput
            type="password"
            placeholder={t.pinPlaceholder}
            label="PIN"
            value={savePin}
            onChange={(e) => setSavePin(e.target.value)}
          />
          <GlassButton variant="primary" onClick={handleSaveKey}>
            {t.save}
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
