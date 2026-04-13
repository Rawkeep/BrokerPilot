import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Learning store — tracks user learning level, progress, and completed lessons.
 * Storage key: 'brokerpilot-learning'
 *
 * Levels: 'einsteiger' | 'fortgeschritten' | 'profi'
 */

const LEARNING_PATHS = {
  'crm-basics': {
    id: 'crm-basics',
    title: 'CRM-Grundlagen',
    description: 'Was ist ein CRM und wie nutzt du es als Broker?',
    level: 'einsteiger',
    lessons: [
      { id: 'crm-1', title: 'Was ist ein Lead?', duration: '3 Min.' },
      { id: 'crm-2', title: 'Die Pipeline verstehen', duration: '4 Min.' },
      { id: 'crm-3', title: 'Lead-Scoring erklaert', duration: '3 Min.' },
      { id: 'crm-4', title: 'Vom Lead zum Abschluss', duration: '5 Min.' },
    ],
  },
  'markt-analyse': {
    id: 'markt-analyse',
    title: 'Marktanalyse',
    description: 'Aktien, Krypto und Marktindikatoren lesen lernen',
    level: 'einsteiger',
    lessons: [
      { id: 'markt-1', title: 'Aktien-Grundlagen: Was ist eine Aktie?', duration: '4 Min.' },
      { id: 'markt-2', title: 'Charts lesen: Candlesticks erklaert', duration: '5 Min.' },
      { id: 'markt-3', title: 'Indizes verstehen (DAX, S&P 500)', duration: '4 Min.' },
      { id: 'markt-4', title: 'Krypto-Basics: Bitcoin & Co.', duration: '5 Min.' },
      { id: 'markt-5', title: 'Markt-Intelligence nutzen', duration: '3 Min.' },
    ],
  },
  'pipeline-pro': {
    id: 'pipeline-pro',
    title: 'Pipeline-Management',
    description: 'Deals effizient durch die Pipeline steuern',
    level: 'fortgeschritten',
    lessons: [
      { id: 'pipe-1', title: 'Pipeline-Stages optimieren', duration: '4 Min.' },
      { id: 'pipe-2', title: 'Conversion-Rates verbessern', duration: '5 Min.' },
      { id: 'pipe-3', title: 'Deal-Priorisierung mit KI', duration: '4 Min.' },
      { id: 'pipe-4', title: 'Automatische Workflows einrichten', duration: '6 Min.' },
    ],
  },
  'finanzkennzahlen': {
    id: 'finanzkennzahlen',
    title: 'Finanzkennzahlen',
    description: 'KPIs, Rendite, Bewertungen — wie Profis rechnen',
    level: 'fortgeschritten',
    lessons: [
      { id: 'fin-1', title: 'KPIs im Vertrieb (Conversion, Revenue, Cycle Time)', duration: '5 Min.' },
      { id: 'fin-2', title: 'ROI und Renditeberechnung', duration: '4 Min.' },
      { id: 'fin-3', title: 'Immobilienbewertung: Vergleichswert, Ertragswert', duration: '6 Min.' },
      { id: 'fin-4', title: 'Risikobewertung und Diversifikation', duration: '5 Min.' },
    ],
  },
  'ki-tools': {
    id: 'ki-tools',
    title: 'KI-Tools meistern',
    description: 'SWOT-Analyse, Markt-Reports und KI-Agenten nutzen',
    level: 'profi',
    lessons: [
      { id: 'ki-1', title: 'SWOT-Analyse mit KI generieren', duration: '4 Min.' },
      { id: 'ki-2', title: 'KI-Agenten fuer Lead-Qualifizierung', duration: '5 Min.' },
      { id: 'ki-3', title: 'Automatische Markt-Reports erstellen', duration: '5 Min.' },
      { id: 'ki-4', title: 'Drip-Kampagnen mit KI-Personalisierung', duration: '6 Min.' },
    ],
  },
  'advanced-analytics': {
    id: 'advanced-analytics',
    title: 'Advanced Analytics',
    description: 'Datengetriebene Entscheidungen wie ein Profi treffen',
    level: 'profi',
    lessons: [
      { id: 'adv-1', title: 'Team-Performance analysieren', duration: '4 Min.' },
      { id: 'adv-2', title: 'Trend-Erkennung und Breakout-Signale', duration: '5 Min.' },
      { id: 'adv-3', title: 'Portfolio-Optimierung', duration: '6 Min.' },
      { id: 'adv-4', title: 'Predictive Analytics im Vertrieb', duration: '5 Min.' },
    ],
  },
};

const DAILY_TIPS = [
  { id: 't1', category: 'CRM', tip: 'Ein Lead ist ein potenzieller Kunde, der Interesse gezeigt hat. Je schneller du reagierst, desto hoeher die Abschlussrate — idealerweise innerhalb von 5 Minuten.' },
  { id: 't2', category: 'Markt', tip: 'Der DAX 40 ist der wichtigste deutsche Aktienindex. Er bildet die 40 groessten boersennotierten Unternehmen Deutschlands ab — darunter SAP, Siemens und Allianz.' },
  { id: 't3', category: 'Krypto', tip: 'Bitcoin (BTC) ist die erste und groesste Kryptowaehrung. Anders als Aktien wird Krypto 24/7 gehandelt — auch am Wochenende.' },
  { id: 't4', category: 'Vertrieb', tip: 'Die Pipeline-Stages (Anfrage → Besichtigung → Angebot → Finanzierung → Notartermin) bilden den typischen Immobilien-Verkaufsprozess ab.' },
  { id: 't5', category: 'KPI', tip: 'Conversion Rate = Abschluesse / Leads × 100. Eine gute Conversion Rate im Immobilienbereich liegt bei 2-5%.' },
  { id: 't6', category: 'Finanzen', tip: 'Incoterms regeln, wer im internationalen Handel fuer Transport, Versicherung und Zoll verantwortlich ist. Die wichtigsten: FOB, CIF, DDP.' },
  { id: 't7', category: 'Charts', tip: 'Ein gruener Candlestick bedeutet: Der Schlusskurs lag ueber dem Eroeffnungskurs (Kursgewinn). Rot = Schlusskurs unter Eroeffnung (Kursverlust).' },
  { id: 't8', category: 'KI', tip: 'Lead-Scoring bewertet automatisch, wie "heiss" ein Lead ist. Faktoren: Deal-Wert, Aktivitaet, Reaktionszeit, und Pipeline-Stage.' },
  { id: 't9', category: 'Markt', tip: 'Ein Breakout-Signal entsteht, wenn ein Kurs sein 52-Wochen-Hoch oder -Tief durchbricht. Das kann den Beginn eines neuen Trends anzeigen.' },
  { id: 't10', category: 'Vertrieb', tip: 'Follow-ups sind entscheidend: 80% der Abschluesse brauchen mindestens 5 Kontaktpunkte. Die meisten Broker geben nach 2 auf.' },
  { id: 't11', category: 'Finanzen', tip: 'Der P/E-Ratio (Kurs-Gewinn-Verhaeltnis) zeigt, wie teuer eine Aktie im Verhaeltnis zu ihrem Gewinn ist. Unter 15 gilt oft als guenstig.' },
  { id: 't12', category: 'CRM', tip: 'Tags helfen dir, Leads zu kategorisieren: "premium", "gewerbe", "investment". So findest du schnell die richtigen Kontakte fuer Kampagnen.' },
  { id: 't13', category: 'Krypto', tip: 'Market Cap = Preis × Umlaufmenge. Bitcoin hat die groesste Market Cap aller Kryptos. Ein hoher Market Cap bedeutet mehr Stabilitaet.' },
  { id: 't14', category: 'KPI', tip: 'Average Deal Size zeigt den durchschnittlichen Wert deiner Abschluesse. Steigt er, gewinnst du profitablere Kunden.' },
  { id: 't15', category: 'Workflow', tip: 'Automatische Workflows sparen bis zu 10h pro Woche: Willkommens-E-Mail bei neuem Lead, Erinnerung nach 24h, Follow-up nach 3 Tagen.' },
];

const BADGES = [
  { id: 'first-lesson', name: 'Erster Schritt', description: 'Erste Lektion abgeschlossen', icon: '🎯' },
  { id: 'crm-complete', name: 'CRM-Kenner', description: 'CRM-Grundlagen abgeschlossen', icon: '📋' },
  { id: 'market-watcher', name: 'Marktbeobachter', description: 'Marktanalyse-Pfad abgeschlossen', icon: '📈' },
  { id: 'pipeline-master', name: 'Pipeline-Meister', description: 'Pipeline-Management abgeschlossen', icon: '🔄' },
  { id: 'finance-expert', name: 'Finanz-Experte', description: 'Finanzkennzahlen gemeistert', icon: '💰' },
  { id: 'ai-pioneer', name: 'KI-Pionier', description: 'KI-Tools gemeistert', icon: '🤖' },
  { id: 'data-driven', name: 'Datengetrieben', description: 'Advanced Analytics gemeistert', icon: '📊' },
  { id: 'all-clear', name: 'Vollstaendig', description: 'Alle Lernpfade abgeschlossen', icon: '🏆' },
];

export const useLearningStore = create(
  persist(
    (set, get) => ({
      level: 'einsteiger',
      completedLessons: [],
      earnedBadges: [],
      showTooltips: true,
      showContextHelp: true,
      lastTipIndex: 0,
      streak: 0,
      lastActiveDate: null,

      // Paths & content (static)
      paths: LEARNING_PATHS,
      tips: DAILY_TIPS,
      badges: BADGES,

      setLevel: (level) => set({ level }),

      completeLesson: (lessonId) => {
        const s = get();
        if (s.completedLessons.includes(lessonId)) return;
        const newCompleted = [...s.completedLessons, lessonId];
        const newBadges = [...s.earnedBadges];

        // Check for first lesson badge
        if (newCompleted.length === 1 && !newBadges.includes('first-lesson')) {
          newBadges.push('first-lesson');
        }

        // Check path completion badges
        const pathBadgeMap = {
          'crm-basics': 'crm-complete',
          'markt-analyse': 'market-watcher',
          'pipeline-pro': 'pipeline-master',
          'finanzkennzahlen': 'finance-expert',
          'ki-tools': 'ai-pioneer',
          'advanced-analytics': 'data-driven',
        };

        Object.entries(LEARNING_PATHS).forEach(([pathId, path]) => {
          const allDone = path.lessons.every((l) => newCompleted.includes(l.id));
          const badgeId = pathBadgeMap[pathId];
          if (allDone && badgeId && !newBadges.includes(badgeId)) {
            newBadges.push(badgeId);
          }
        });

        // Check all-clear badge
        const allLessons = Object.values(LEARNING_PATHS).flatMap((p) => p.lessons.map((l) => l.id));
        if (allLessons.every((id) => newCompleted.includes(id)) && !newBadges.includes('all-clear')) {
          newBadges.push('all-clear');
        }

        // Auto-level-up
        let newLevel = s.level;
        if (newCompleted.length >= 8 && newLevel === 'einsteiger') newLevel = 'fortgeschritten';
        if (newCompleted.length >= 18 && newLevel === 'fortgeschritten') newLevel = 'profi';

        set({ completedLessons: newCompleted, earnedBadges: newBadges, level: newLevel });
      },

      getPathProgress: (pathId) => {
        const path = LEARNING_PATHS[pathId];
        if (!path) return 0;
        const done = path.lessons.filter((l) => get().completedLessons.includes(l.id)).length;
        return Math.round((done / path.lessons.length) * 100);
      },

      getTotalProgress: () => {
        const all = Object.values(LEARNING_PATHS).flatMap((p) => p.lessons);
        const done = all.filter((l) => get().completedLessons.includes(l.id)).length;
        return Math.round((done / all.length) * 100);
      },

      getDailyTip: () => {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
      },

      toggleTooltips: () => set((s) => ({ showTooltips: !s.showTooltips })),
      toggleContextHelp: () => set((s) => ({ showContextHelp: !s.showContextHelp })),
    }),
    { name: 'brokerpilot-learning' }
  )
);
