import { useState } from 'react';
import { NavLink } from 'react-router';
import { useSettingsStore } from '../../stores/settingsStore';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { de } from '../../i18n/de.js';
import { HamburgerMenu } from './HamburgerMenu.jsx';

const PATH_MAP = {
  dashboard: '/dashboard',
  pipeline: '/pipeline',
  markt: '/markt',
  'ai-agents': '/ai-agents',
  einstellungen: '/einstellungen',
};

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const navOrder =
    BROKER_TYPES[brokerType]?.navOrder || ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'];

  return (
    <nav className="top-nav">
      <span className="top-nav__brand">{de.app.name}</span>

      <div className="top-nav__tabs">
        {navOrder.map((tabId) => (
          <NavLink
            key={tabId}
            to={PATH_MAP[tabId] || `/${tabId}`}
            className={({ isActive }) =>
              `top-nav__tab${isActive ? ' top-nav__tab--active' : ''}`
            }
            end={tabId === 'dashboard'}
          >
            {de.nav[tabId] || tabId}
          </NavLink>
        ))}
      </div>

      <button
        className="top-nav__hamburger"
        onClick={() => setMenuOpen(true)}
        aria-label="Menu"
      >
        &#9776;
      </button>

      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </nav>
  );
}
