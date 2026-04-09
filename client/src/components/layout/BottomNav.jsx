import { NavLink, useLocation } from 'react-router';
import { useState } from 'react';
import { de } from '../../i18n/de.js';

const MAIN_TABS = [
  { id: 'dashboard', path: '/dashboard', icon: '\u{1F4CA}' },
  { id: 'pipeline', path: '/pipeline', icon: '\u{1F504}' },
  { id: 'kalender', path: '/kalender', icon: '\u{1F4C5}' },
  { id: 'ai-agents', path: '/ai-agents', icon: '\u{1F916}' },
];

const MORE_TABS = [
  { id: 'markt', path: '/markt', icon: '\u{1F4C8}' },
  { id: 'analytics', path: '/analytics', icon: '\u{1F4C9}' },
  { id: 'team', path: '/team', icon: '\u{1F465}' },
  { id: 'kampagnen', path: '/kampagnen', icon: '\u{1F4EC}' },
  { id: 'workflows', path: '/workflows', icon: '\u26A1' },
  { id: 'einstellungen', path: '/einstellungen', icon: '\u2699\uFE0F' },
];

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const isMoreActive = MORE_TABS.some((t) => location.pathname.startsWith(t.path));

  return (
    <>
      {moreOpen && (
        <div className="bottom-nav__overlay" onClick={() => setMoreOpen(false)} />
      )}
      {moreOpen && (
        <div className="bottom-nav__more-menu">
          {MORE_TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className="bottom-nav__item"
              onClick={() => setMoreOpen(false)}
            >
              <span className="bottom-nav__icon">{tab.icon}</span>
              <span className="bottom-nav__label">{de.nav[tab.id] || tab.id}</span>
            </NavLink>
          ))}
        </div>
      )}
      <nav className="bottom-nav">
        {MAIN_TABS.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
            }
            onClick={() => setMoreOpen(false)}
          >
            <span className="bottom-nav__icon">{tab.icon}</span>
            <span className="bottom-nav__label">{de.nav[tab.id] || tab.id}</span>
          </NavLink>
        ))}
        <button
          className={`bottom-nav__item${isMoreActive ? ' bottom-nav__item--active' : ''}`}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <span className="bottom-nav__icon">{moreOpen ? '\u2715' : '\u2630'}</span>
          <span className="bottom-nav__label">Mehr</span>
        </button>
      </nav>
    </>
  );
}
