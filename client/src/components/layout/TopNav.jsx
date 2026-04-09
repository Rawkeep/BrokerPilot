import { useState } from 'react';
import { NavLink } from 'react-router';
import { useSettingsStore } from '../../stores/settingsStore';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { t, useLanguage } from '../../i18n/index.js';
import { HamburgerMenu } from './HamburgerMenu.jsx';
import { NotificationCenter } from './NotificationCenter.jsx';

const PATH_MAP = {
  dashboard: '/dashboard',
  pipeline: '/pipeline',
  markt: '/markt',
  'ai-agents': '/ai-agents',
  analytics: '/analytics',
  kalender: '/kalender',
  team: '/team',
  kampagnen: '/kampagnen',
  workflows: '/workflows',
  einstellungen: '/einstellungen',
};

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language } = useLanguage(); // triggers re-render on language change
  const brokerType = useSettingsStore((s) => s.brokerType);
  const navOrder =
    BROKER_TYPES[brokerType]?.navOrder || ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'];

  return (
    <nav className="top-nav">
      <span className="top-nav__brand">{t('app.name')}</span>

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
            {t('nav.' + tabId) || tabId}
          </NavLink>
        ))}
      </div>

      <NotificationCenter />

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
