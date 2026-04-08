import { useSettingsStore } from '../../stores/settingsStore';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

export function BrokerTypeSelector() {
  const brokerType = useSettingsStore((s) => s.brokerType);
  const setBrokerType = useSettingsStore((s) => s.setBrokerType);
  const t = de.settings.brokerType;

  return (
    <div>
      <p className="settings-section__description">{t.description}</p>
      <div className="broker-type-grid">
        {Object.keys(BROKER_TYPES).map((type) => (
          <GlassCard
            key={type}
            className={`broker-type-card${brokerType === type ? ' broker-type-card--selected' : ''}`}
            onClick={() => setBrokerType(type)}
          >
            <span className="broker-type-card__label">{t[type] || BROKER_TYPES[type].label}</span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
