import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config.js';

const STATUS = { ok: 'ok', error: 'error', inactive: 'inactive' };

const LABELS = {
  ok: 'Online',
  error: 'Fehler',
  inactive: 'Nicht konfiguriert',
};

function StatusDot({ status }) {
  return (
    <span
      className={`health__dot health__dot--${status}`}
      title={LABELS[status]}
    />
  );
}

function useHealthCheck(interval = 30_000) {
  const [health, setHealth] = useState(null);
  const [apiStatus, setApiStatus] = useState(STATUS.inactive);
  const [startTime] = useState(Date.now());

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setApiStatus(STATUS.ok);
      } else {
        setApiStatus(STATUS.error);
      }
    } catch {
      setApiStatus(STATUS.error);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, interval);
    return () => clearInterval(id);
  }, [check, interval]);

  return { health, apiStatus, startTime };
}

function formatUptime(startMs) {
  const diff = Math.floor((Date.now() - startMs) / 1000);
  if (diff < 60) return `${diff} Sekunden`;
  if (diff < 3600) return `${Math.floor(diff / 60)} Minuten`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

export function HealthDashboard() {
  const { health, apiStatus, startTime } = useHealthCheck();
  const [now, setNow] = useState(Date.now());

  // Refresh uptime display every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sentryStatus = import.meta.env.VITE_SENTRY_DSN ? STATUS.ok : STATUS.inactive;
  const supabaseStatus = import.meta.env.VITE_SUPABASE_URL ? STATUS.ok : STATUS.inactive;
  const stripeConfigured = health?.services?.stripe ?? false;
  const emailConfigured = health?.services?.email ?? false;

  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const services = [
    { label: 'Frontend', status: STATUS.ok },
    { label: 'Backend API', status: apiStatus },
    { label: 'Sentry', status: sentryStatus },
    { label: 'Supabase', status: supabaseStatus },
    { label: 'Stripe', status: stripeConfigured ? STATUS.ok : STATUS.inactive },
    { label: 'E-Mail', status: emailConfigured ? STATUS.ok : STATUS.inactive },
  ];

  return (
    <div className="health glass-card">
      <h3 className="health__title">System-Status</h3>

      <div className="health__grid">
        {services.map(({ label, status }) => (
          <div key={label} className="health__row">
            <span className="health__label">{label}</span>
            <span className={`health__status health__status--${status}`}>
              <StatusDot status={status} />
              {LABELS[status]}
            </span>
          </div>
        ))}
      </div>

      <div className="health__footer">
        <span className="health__meta">Version: {version}</span>
        <span className="health__meta">Uptime: {formatUptime(startTime)}</span>
        <span className="health__meta">
          Letzter Fehler: {health?.lastError || 'Keiner'}
        </span>
      </div>
    </div>
  );
}

export default HealthDashboard;
