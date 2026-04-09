import { useState } from 'react';
import { useLeadStore } from '../../stores/leadStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';

const DEMO_LEADS = [
  {
    name: 'Thomas Wagner',
    email: 'wagner@immocorp.de',
    company: 'ImmoCorp GmbH',
    phone: '+49 170 1234567',
    dealValue: 450000,
    stage: 'besichtigung',
    priority: 'high',
    notes: 'Sucht 3-Zimmer-Wohnung in M\u00FCnchen',
    tags: ['premium', 'm\u00FCnchen'],
  },
  {
    name: 'Sarah Klein',
    email: 'klein@finanzhaus.de',
    company: 'Finanzhaus AG',
    phone: '+49 171 2345678',
    dealValue: 280000,
    stage: 'finanzierung',
    priority: 'medium',
    notes: 'Baufinanzierung l\u00E4uft',
    tags: ['finanzierung'],
  },
  {
    name: 'Michael Braun',
    email: 'braun@techstart.io',
    company: 'TechStart GmbH',
    phone: '+49 172 3456789',
    dealValue: 850000,
    stage: 'angebot',
    priority: 'high',
    notes: 'Gewerbeimmobilie',
    tags: ['gewerbe', 'premium'],
  },
  {
    name: 'Julia Fischer',
    email: 'fischer@invest.de',
    company: 'Fischer Investments',
    phone: '+49 173 4567890',
    dealValue: 120000,
    stage: 'anfrage',
    priority: 'low',
    notes: 'Erstinteresse',
    tags: ['neu'],
  },
  {
    name: 'Robert Schneider',
    email: 'schneider@bau.de',
    company: 'Schneider Bau',
    phone: '+49 174 5678901',
    dealValue: 1200000,
    stage: 'notartermin',
    priority: 'high',
    notes: 'Notartermin n\u00E4chste Woche',
    tags: ['premium', 'abschluss-nah'],
  },
  {
    name: 'Elena Meyer',
    email: 'meyer@startup.de',
    company: 'GreenTech Solutions',
    phone: '+49 175 6789012',
    dealValue: 65000,
    stage: 'anfrage',
    priority: 'medium',
    notes: 'Kleinwohnung f\u00FCr Investment',
    tags: ['investment'],
  },
  {
    name: 'Hans M\u00FCller',
    email: 'mueller@corp.de',
    company: 'M\u00FCller & Partner',
    phone: '+49 176 7890123',
    dealValue: 380000,
    stage: 'besichtigung',
    priority: 'medium',
    notes: 'Familienhaus gesucht',
    tags: ['familie'],
  },
  {
    name: 'Katrin Wolf',
    email: 'wolf@digital.de',
    company: 'Digital Homes',
    phone: '+49 177 8901234',
    dealValue: 520000,
    stage: 'finanzierung',
    priority: 'high',
    notes: 'Zweite Besichtigung positiv',
    tags: ['premium', 'follow-up'],
  },
];

const DEMO_EVENTS = [
  {
    title: 'Besichtigung Wagner',
    leadName: 'Thomas Wagner',
    type: 'besichtigung',
    date: getRelativeDate(1),
    time: '10:00',
    duration: '1h',
    location: 'M\u00FCnchen, Maximilianstr. 12',
  },
  {
    title: 'Beratung Klein',
    leadName: 'Sarah Klein',
    type: 'beratung',
    date: getRelativeDate(2),
    time: '14:00',
    duration: '1h',
    location: 'B\u00FCro',
  },
  {
    title: 'Notartermin Schneider',
    leadName: 'Robert Schneider',
    type: 'notartermin',
    date: getRelativeDate(5),
    time: '09:00',
    duration: '2h',
    location: 'Notar Dr. Becker, Frankfurt',
  },
];

function getRelativeDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function DemoDataLoader() {
  const leads = useLeadStore((s) => s.leads);
  const addLead = useLeadStore((s) => s.addLead);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Only show when no leads exist
  if (leads.length > 0 || loaded) return null;

  const handleLoad = async () => {
    setLoading(true);
    try {
      const type = brokerType || 'immobilien';
      for (const lead of DEMO_LEADS) {
        await addLead(type, lead);
      }
      for (const event of DEMO_EVENTS) {
        addEvent(event);
      }
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-loader">
      <div className="demo-loader__card glass-card">
        <p>Keine Leads vorhanden. M\u00F6chten Sie Demo-Daten laden?</p>
        <button
          className="demo-loader__btn onboarding-tooltip__btn onboarding-tooltip__btn--primary"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? 'Laden...' : 'Demo-Daten laden'}
        </button>
      </div>
    </div>
  );
}
