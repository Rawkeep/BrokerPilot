import { NavLink } from 'react-router';
import { useSettingsStore } from '../../stores/settingsStore';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { de } from '../../i18n/de.js';

const PATH_MAP = {
  dashboard: '/',
  pipeline: '/pipeline',
  markt: '/markt',
  'ai-agents': '/ai-agents',
  kalender: '/kalender',
  akademie: '/akademie',
  trading: '/trading',
  einstellungen: '/einstellungen',
};

export function HamburgerMenu({ isOpen, onClose }) {
  const brokerType = useSettingsStore((s) => s.brokerType);
  const navOrder =
    BROKER_TYPES[brokerType]?.navOrder || ['dashboard', 'pipeline', 'markt', 'trading', 'ai-agents', 'einstellungen'];

  return (
    <>
      {isOpen && (
        <div className="hamburger-overlay" onClick={onClose} />
      )}
      <aside
        className={`hamburger-panel ${isOpen ? 'hamburger-panel--open' : 'hamburger-panel--closed'}`}
      >
        <div className="hamburger-panel__header">
          <span className="top-nav__brand">{de.app.name}</span>
          <button className="hamburger-panel__close" onClick={onClose} aria-label={de.common.close}>
            &times;
          </button>
        </div>
        <nav className="hamburger-panel__nav">
          {navOrder.map((tabId) => (
            <NavLink
              key={tabId}
              to={PATH_MAP[tabId] || `/${tabId}`}
              className={({ isActive }) =>
                `hamburger-panel__link${isActive ? ' hamburger-panel__link--active' : ''}`
              }
              onClick={onClose}
            >
              {de.nav[tabId] || tabId}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
