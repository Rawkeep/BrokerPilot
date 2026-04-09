import { Link } from 'react-router';

const FEATURES = [
  {
    icon: '\u{1F916}',
    title: 'KI-Agenten',
    desc: 'Drei spezialisierte KI-Agenten qualifizieren, analysieren und strategisieren automatisch.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Analytics & Reports',
    desc: 'Echtzeit-KPIs, Conversion-Funnels und PDF-Reports auf Knopfdruck.',
  },
  {
    icon: '⚡',
    title: 'Workflow Automation',
    desc: 'Visueller Builder für automatisierte Prozesse mit 7 Aktionstypen.',
  },
  {
    icon: '\u{1F4E7}',
    title: 'E-Mail & Kampagnen',
    desc: '25+ Templates, KI-Personalisierung und automatisierte Drip-Sequenzen.',
  },
  {
    icon: '\u{1F4C5}',
    title: 'Kalender',
    desc: 'Terminplanung direkt im CRM mit Lead-Verknüpfung und Erinnerungen.',
  },
  {
    icon: '\u{1F465}',
    title: 'Team Management',
    desc: 'Leaderboard, Rollenverwaltung und Lead-Zuweisung für Ihr Team.',
  },
  {
    icon: '\u{1F525}',
    title: 'Lead-Scoring',
    desc: 'Automatische Bewertung mit Hot/Warm/Cold-Tiers für priorisierte Akquise.',
  },
  {
    icon: '\u{1F4F1}',
    title: 'Mobile First',
    desc: 'Responsive Design mit Bottom-Navigation und Touch-optimiertem Kanban.',
  },
];

const BROKER_TYPES = [
  { icon: '\u{1F3E0}', name: 'Immobilien' },
  { icon: '\u{20BF}',  name: 'Krypto' },
  { icon: '\u{1F4B9}', name: 'Finanz' },
  { icon: '\u{1F6E1}️', name: 'Versicherung' },
  { icon: '\u{1F4C8}', name: 'Investment' },
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Kostenlos',
    period: '',
    features: [
      'Bis zu 50 Leads',
      '1 Nutzer',
      '5 KI-Anfragen pro Tag',
      'Basic Pipeline',
      'E-Mail-Support',
    ],
    cta: 'Kostenlos starten',
    popular: false,
  },
  {
    name: 'Professional',
    price: '€49',
    period: '/Monat',
    features: [
      'Unbegrenzte Leads',
      'Bis zu 5 Nutzer',
      'Unbegrenzte KI-Anfragen',
      'Alle Features inklusive',
      'Workflow Automation',
      'Prioritäts-Support',
    ],
    cta: 'Jetzt buchen',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Auf Anfrage',
    period: '',
    features: [
      'Unbegrenzte Leads & Nutzer',
      'Custom KI-Modelle',
      'Dedicated Account Manager',
      'SLA & On-Premise Option',
      'API-Zugang',
      'Individuelle Schulung',
    ],
    cta: 'Kontakt aufnehmen',
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    quote: 'BrokerPilot hat unseren Umsatz um 40% gesteigert. Die KI-Agenten sparen uns täglich Stunden.',
    author: 'Thomas M.',
    role: 'Immobilienmakler, München',
  },
  {
    quote: 'Endlich ein CRM, das unseren Krypto-Workflow versteht. Die automatisierten Pipelines sind grandios.',
    author: 'Sarah K.',
    role: 'Krypto-Brokerin, Berlin',
  },
  {
    quote: 'Das Lead-Scoring hat unsere Conversion-Rate verdoppelt. Absolut empfehlenswert.',
    author: 'Michael R.',
    role: 'Finanzberater, Hamburg',
  },
];

const STATS = [
  { number: '500+', label: 'Aktive Broker' },
  { number: '10.000+', label: 'Verwaltete Leads' },
  { number: '€50M+', label: 'Pipeline-Volumen' },
];

export function LandingPage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/welcome" className="landing-nav__logo">
            <span className="landing-nav__logo-icon">{'\u{1F680}'}</span>
            BrokerPilot
          </Link>
          <ul className="landing-nav__links">
            <li><a href="#features" className="landing-nav__link">Features</a></li>
            <li><a href="#preise" className="landing-nav__link">Preise</a></li>
            <li><Link to="/dashboard" className="landing-nav__link landing-nav__link--cta">Login</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__container">
          <span className="landing__hero-badge">Neu: KI-Agenten 2.0</span>
          <h1 className="landing__hero-title">
            Das KI-gestützte Broker-CRM{'\n'}der nächsten Generation
          </h1>
          <p className="landing__hero-subtitle">
            Automatisieren Sie Ihren gesamten Vertriebsprozess mit intelligenten
            KI-Agenten, Lead-Scoring und visuellen Workflows.
          </p>
          <div className="landing__hero-actions">
            <Link to="/dashboard" className="landing__btn landing__btn--primary">
              Kostenlos starten
            </Link>
            <a href="#features" className="landing__btn landing__btn--secondary">
              Demo ansehen
            </a>
          </div>
          <div className="landing__hero-checks">
            <span className="landing__hero-check">
              <span className="landing__hero-check-icon">{'✓'}</span> 5 Broker-Typen
            </span>
            <span className="landing__hero-check">
              <span className="landing__hero-check-icon">{'✓'}</span> KI-Agenten
            </span>
            <span className="landing__hero-check">
              <span className="landing__hero-check-icon">{'✓'}</span> Keine Kreditkarte
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features" id="features">
        <div className="landing__container">
          <p className="landing__section-label">Features</p>
          <h2 className="landing__section-title">Alles, was Sie brauchen</h2>
          <p className="landing__section-desc">
            Ein komplettes CRM-System mit KI-Power — speziell für Broker entwickelt.
          </p>
          <div className="landing__features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing__feature-card">
                <span className="landing__feature-icon">{f.icon}</span>
                <h3 className="landing__feature-title">{f.title}</h3>
                <p className="landing__feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Broker Types */}
      <section className="landing__broker-types">
        <div className="landing__container">
          <p className="landing__section-label">Broker-Typen</p>
          <h2 className="landing__section-title">Spezialisiert für Ihren Markt</h2>
          <p className="landing__section-desc">
            Jeder Typ mit angepasster Pipeline, Feldern und KI-Konfiguration.
          </p>
          <div className="landing__broker-grid">
            {BROKER_TYPES.map((b) => (
              <span key={b.name} className="landing__broker-chip">
                <span className="landing__broker-chip-icon">{b.icon}</span>
                {b.name}
              </span>
            ))}
          </div>
          <p className="landing__broker-note">
            Wechseln Sie jederzeit zwischen Broker-Typen — Ihre Daten bleiben erhalten.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing__pricing" id="preise">
        <div className="landing__container">
          <p className="landing__section-label">Preise</p>
          <h2 className="landing__section-title">Transparent & fair</h2>
          <p className="landing__section-desc">
            Starten Sie kostenlos und skalieren Sie mit Ihrem Geschäft.
          </p>
          <div className="landing__pricing-grid">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`landing__pricing-card${tier.popular ? ' landing__pricing-card--popular' : ''}`}
              >
                {tier.popular && <span className="landing__pricing-badge">Beliebt</span>}
                <h3 className="landing__pricing-name">{tier.name}</h3>
                <div className="landing__pricing-price">
                  {tier.price}
                  {tier.period && <span>{tier.period}</span>}
                </div>
                <ul className="landing__pricing-features">
                  {tier.features.map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
                <Link
                  to="/dashboard"
                  className={`landing__btn landing__pricing-btn ${
                    tier.popular ? 'landing__btn--primary' : 'landing__btn--secondary'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing__testimonials">
        <div className="landing__container">
          <p className="landing__section-label">Kundenstimmen</p>
          <h2 className="landing__section-title">Was unsere Nutzer sagen</h2>
          <div className="landing__testimonials-grid" style={{ marginTop: '48px' }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="landing__testimonial-card">
                <p className="landing__testimonial-quote">{t.quote}</p>
                <p className="landing__testimonial-author">{t.author}</p>
                <p className="landing__testimonial-role">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing__stats">
        <div className="landing__container">
          <div className="landing__stats-grid">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="landing__stat-number">{s.number}</p>
                <p className="landing__stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing__cta">
        <div className="landing__container">
          <h2 className="landing__cta-title">
            Bereit, Ihren Vertrieb zu revolutionieren?
          </h2>
          <p className="landing__cta-subtitle">
            Starten Sie noch heute kostenlos — keine Kreditkarte erforderlich.
          </p>
          <Link to="/dashboard" className="landing__btn landing__btn--primary">
            Kostenlos starten
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-grid">
          <div className="landing__footer-brand">
            <div className="landing__footer-brand-name">{'\u{1F680}'} BrokerPilot</div>
            <p>
              Das KI-gestützte Broker-CRM der nächsten Generation.
              Automatisieren Sie Ihren Vertrieb mit intelligenten Agenten.
            </p>
          </div>
          <div>
            <h4 className="landing__footer-col-title">Produkt</h4>
            <ul className="landing__footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#preise">Preise</a></li>
              <li><Link to="/dashboard">Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="landing__footer-col-title">Rechtliches</h4>
            <ul className="landing__footer-links">
              <li><Link to="/impressum">Impressum</Link></li>
              <li><Link to="/datenschutz">Datenschutz</Link></li>
              <li><Link to="/agb">AGB</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="landing__footer-col-title">Kontakt</h4>
            <ul className="landing__footer-links">
              <li><a href="mailto:info@brokerpilot.de">E-Mail</a></li>
              <li><a href="mailto:support@brokerpilot.de">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="landing__footer-bottom">
          &copy; 2026 BrokerPilot. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
