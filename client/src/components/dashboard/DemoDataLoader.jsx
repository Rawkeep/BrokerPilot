import { useState, useEffect } from 'react';
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
    notes: 'Sucht 3-Zimmer-Wohnung in M\u00FCnchen, Budget bis 500k',
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
    notes: 'Baufinanzierung l\u00E4uft, Zusage erwartet KW16',
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
    notes: 'Gewerbeimmobilie 200m\u00B2 im Rheinauhafen, 2. Angebot verschickt',
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
    notes: 'Erstinteresse \u00FCber Website-Formular, R\u00FCckruf vereinbart',
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
    notes: 'Notartermin 15.04. um 10:00, alle Unterlagen komplett',
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
    notes: 'Kleinwohnung f\u00FCr Investment, Kapitalanlage',
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
    notes: 'Familienhaus mit Garten, 4+ Zimmer, K\u00F6ln-S\u00FCd',
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
    notes: 'Zweite Besichtigung positiv, Finanzierungszusage fast fertig',
    tags: ['premium', 'follow-up'],
  },
  {
    name: 'Stefan Becker',
    email: 'becker@logistics.de',
    company: 'Becker Logistik GmbH',
    phone: '+49 178 9012345',
    dealValue: 675000,
    stage: 'angebot',
    priority: 'high',
    notes: 'Lagerhalle 500m\u00B2 in Porz, Mietvertrag 10 Jahre',
    tags: ['gewerbe', 'logistik'],
  },
  {
    name: 'Maria Hoffmann',
    email: 'hoffmann@architektur.de',
    company: 'Hoffmann Architekten',
    phone: '+49 179 0123456',
    dealValue: 195000,
    stage: 'besichtigung',
    priority: 'medium',
    notes: 'Eigentumswohnung Altbau Ehrenfeld, 1. Besichtigung Do',
    tags: ['altbau', 'koeln'],
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
    notes: '3-Zi-Wohnung, Schl\u00FCssel beim Hausmeister',
  },
  {
    title: 'Finanzierungsgespr\u00E4ch Klein',
    leadName: 'Sarah Klein',
    type: 'beratung',
    date: getRelativeDate(2),
    time: '14:00',
    duration: '1h',
    location: 'B\u00FCro',
    notes: 'Unterlagen Finanzhaus mitbringen',
  },
  {
    title: 'Notartermin Schneider',
    leadName: 'Robert Schneider',
    type: 'notartermin',
    date: getRelativeDate(5),
    time: '09:00',
    duration: '2h',
    location: 'Notar Dr. Becker, Frankfurt',
    notes: 'Kaufpreis 1.2M EUR, alle Dokumente gepr\u00FCft',
  },
  {
    title: 'Follow-up Braun',
    leadName: 'Michael Braun',
    type: 'telefonat',
    date: getRelativeDate(0),
    time: '15:30',
    duration: '30min',
    location: '',
    notes: 'Angebots-Feedback einholen, Preisnachlass m\u00F6glich?',
  },
  {
    title: 'Besichtigung Hoffmann',
    leadName: 'Maria Hoffmann',
    type: 'besichtigung',
    date: getRelativeDate(3),
    time: '11:00',
    duration: '45min',
    location: 'K\u00F6ln-Ehrenfeld, Venloer Str. 234',
    notes: 'Altbau-ETW, 3. OG, Balkon',
  },
  {
    title: 'Team-Meeting Pipeline Review',
    leadName: '',
    type: 'intern',
    date: getRelativeDate(1),
    time: '09:00',
    duration: '1h',
    location: 'Konferenzraum',
    notes: 'Wochenr\u00FCckblick, offene Deals besprechen',
  },
  {
    title: 'Lagerbesichtigung Becker',
    leadName: 'Stefan Becker',
    type: 'besichtigung',
    date: getRelativeDate(4),
    time: '14:00',
    duration: '1.5h',
    location: 'K\u00F6ln-Porz, Industriestr. 45',
    notes: 'Lagerhalle 500m\u00B2, Zufahrt f\u00FCr LKW pr\u00FCfen',
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
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Auto-load demo data on first visit (no leads exist)
  useEffect(() => {
    if (leads.length === 0 && !loaded && !autoLoaded && !loading) {
      setAutoLoaded(true);
      handleLoad();
    }
  }, [leads.length]);

  // Don't show anything if leads exist or already loaded
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
        <p>{loading ? 'Demo-Daten werden geladen...' : 'Keine Leads vorhanden.'}</p>
        {!loading && (
          <button
            className="demo-loader__btn onboarding-tooltip__btn onboarding-tooltip__btn--primary"
            onClick={handleLoad}
            disabled={loading}
          >
            Demo-Daten laden
          </button>
        )}
      </div>
    </div>
  );
}
