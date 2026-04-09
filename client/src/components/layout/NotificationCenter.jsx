import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useNotificationStore } from '../../stores/notificationStore.js';

const TYPE_ICONS = {
  info: '\u2139\uFE0F',
  success: '\u2705',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
  lead: '\uD83D\uDC64',
  deal: '\uD83E\uDD1D',
  reminder: '\u23F0',
  ai: '\uD83E\uDD16',
};

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min`;
  if (hours < 24) return `vor ${hours} Std`;
  if (days === 1) return 'vor 1 Tag';
  return `vor ${days} Tagen`;
}

function getDateGroup(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDate.getTime() >= today.getTime()) return 'Heute';
  if (notifDate.getTime() >= yesterday.getTime()) return 'Gestern';
  return '\u00C4lter';
}

function groupNotifications(notifications) {
  const groups = {};
  const order = ['Heute', 'Gestern', '\u00C4lter'];

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  }

  return order.filter((g) => groups[g]).map((g) => ({ label: g, items: groups[g] }));
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const getUnread = useNotificationStore((s) => s.getUnread);

  const unreadCount = getUnread();
  const grouped = groupNotifications(notifications);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleNotificationClick(n) {
    markRead(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  }

  return (
    <div className="notif-center" ref={panelRef}>
      <button
        className={`notif-center__bell${unreadCount > 0 ? ' notif-center__bell--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-center__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-center__dropdown">
          <div className="notif-center__header">
            <span className="notif-center__title">Benachrichtigungen</span>
            {unreadCount > 0 && (
              <button className="notif-center__mark-all" onClick={markAllRead}>
                Alle gelesen
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-center__empty">Keine Benachrichtigungen</div>
          ) : (
            <div className="notif-center__list">
              {grouped.map((group) => (
                <div key={group.label}>
                  <div className="notif-center__group-label">{group.label}</div>
                  {group.items.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-center__item${!n.read ? ' notif-center__item--unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)}
                    >
                      <span className="notif-center__icon">{TYPE_ICONS[n.type] || TYPE_ICONS.info}</span>
                      <div className="notif-center__content">
                        <span className="notif-center__item-title">{n.title}</span>
                        <span className="notif-center__item-msg">{n.message}</span>
                      </div>
                      <div className="notif-center__meta">
                        <span className="notif-center__time">{timeAgo(n.createdAt)}</span>
                        <button
                          className="notif-center__delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          aria-label="Entfernen"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
