import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { useLearningStore } from '../../stores/learningStore.js';

/**
 * Lesson content — mapped by lesson ID.
 * Each lesson has structured content with explanations and examples.
 */
const LESSON_CONTENT = {
  'crm-1': {
    title: 'Was ist ein Lead?',
    sections: [
      { type: 'text', content: 'Ein Lead ist ein potenzieller Kunde, der auf irgendeine Weise Interesse an deinem Angebot gezeigt hat. Das kann eine Anfrage ueber deine Website sein, ein Anruf, eine Empfehlung oder ein Kontakt auf einer Messe.' },
      { type: 'example', content: 'Beispiel: Thomas Wagner ruft an und sagt "Ich suche eine 3-Zimmer-Wohnung in Muenchen." → Ab jetzt ist er ein Lead in deinem CRM.' },
      { type: 'text', content: 'Im BrokerPilot erfasst du Leads mit Name, E-Mail, Telefon, Firma und Deal-Wert. Jeder Lead bekommt automatisch einen Score, der anzeigt wie vielversprechend er ist.' },
      { type: 'tip', content: 'Profi-Tipp: Reagiere innerhalb von 5 Minuten auf neue Leads. Studien zeigen, dass die Abschlussrate nach 5 Minuten um 80% sinkt.' },
    ],
  },
  'crm-2': {
    title: 'Die Pipeline verstehen',
    sections: [
      { type: 'text', content: 'Die Pipeline ist wie ein Trichter: Oben kommen viele Leads rein, unten kommen die Abschluesse raus. Dazwischen liegen verschiedene Stages (Phasen):' },
      { type: 'list', items: ['Anfrage — Erster Kontakt, Interesse bekundet', 'Besichtigung — Termin vereinbart und durchgefuehrt', 'Angebot — Konkretes Angebot erstellt und verschickt', 'Finanzierung — Finanzierung wird geprueft/beantragt', 'Notartermin — Vertrag wird beim Notar unterzeichnet', 'Abgeschlossen — Deal ist durch! 🎉'] },
      { type: 'text', content: 'In BrokerPilot siehst du die Pipeline als Kanban-Board. Du kannst Leads per Drag & Drop zwischen den Stages verschieben.' },
      { type: 'tip', content: 'Eine gesunde Pipeline hat in jeder Stage genuegend Deals. Wenn eine Stage leer ist, hast du ein Problem — handle schnell!' },
    ],
  },
  'crm-3': {
    title: 'Lead-Scoring erklaert',
    sections: [
      { type: 'text', content: 'Lead-Scoring bewertet automatisch, wie wahrscheinlich ein Abschluss ist. Der Score reicht von 0 (kalt) bis 100 (heiss).' },
      { type: 'list', items: ['80-100 = 🔥 Hot Lead — sofort kontaktieren!', '50-79 = Warm Lead — regelmaessig pflegen', '20-49 = Cool Lead — langfristig im Blick behalten', '0-19 = Cold Lead — noch nicht kaufbereit'] },
      { type: 'text', content: 'Der Score basiert auf: Deal-Wert (hoeher = mehr Punkte), Pipeline-Stage (weiter = mehr Punkte), Aktivitaet (geoeffnete E-Mails, Termine), Tags (z.B. "premium"), und Reaktionszeit.' },
      { type: 'example', content: 'Robert Schneider: Deal 1.2M EUR, Stage "Notartermin", Tags "premium" + "abschluss-nah" → Score: 95 🔥' },
    ],
  },
  'crm-4': {
    title: 'Vom Lead zum Abschluss',
    sections: [
      { type: 'text', content: 'Der typische Weg eines Leads durch dein CRM:' },
      { type: 'list', items: ['1. Lead wird erfasst (manuell oder automatisch)', '2. Erstgespraech fuehren, Beduerfnisse verstehen', '3. Passende Objekte/Produkte praesentieren', '4. Besichtigungstermin vereinbaren', '5. Angebot erstellen und versenden', '6. Finanzierung klaeren', '7. Vertragsverhandlung', '8. Notartermin / Abschluss'] },
      { type: 'tip', content: 'Dokumentiere jeden Schritt im CRM! So weiss jeder im Team, wo der Deal steht. Und du vergisst kein Follow-up.' },
    ],
  },
  'markt-1': {
    title: 'Aktien-Grundlagen: Was ist eine Aktie?',
    sections: [
      { type: 'text', content: 'Eine Aktie ist ein Anteil an einem Unternehmen. Wenn du eine Apple-Aktie kaufst, gehoert dir ein winziger Teil von Apple. Es gibt weltweit tausende Aktien, die an Boersen gehandelt werden.' },
      { type: 'text', content: 'Der Kurs einer Aktie wird durch Angebot und Nachfrage bestimmt: Wollen viele kaufen → Kurs steigt. Wollen viele verkaufen → Kurs faellt.' },
      { type: 'example', content: 'SAP SE (SAP.DE): Groesstes deutsches Software-Unternehmen. Wenn SAP gute Quartalszahlen meldet, kaufen Investoren → Kurs steigt.' },
      { type: 'tip', content: 'Im BrokerPilot findest du Aktien unter "Markt" → "Aktien". Suche nach einem Ticker-Symbol (z.B. SAP.DE) fuer Details und Charts.' },
    ],
  },
  'markt-2': {
    title: 'Charts lesen: Candlesticks erklaert',
    sections: [
      { type: 'text', content: 'Ein Candlestick-Chart zeigt die Kursentwicklung in "Kerzen". Jede Kerze hat 4 Werte: Open (Eroeffnung), High (Hoechst), Low (Tiefst), Close (Schluss).' },
      { type: 'list', items: ['Gruene Kerze: Schlusskurs UEBER Eroeffnung → Kursgewinn', 'Rote Kerze: Schlusskurs UNTER Eroeffnung → Kursverlust', 'Langer Docht oben: Kurs wurde hochgedrueckt, dann zurueckgewiesen', 'Langer Docht unten: Kurs fiel tief, erholte sich aber wieder'] },
      { type: 'tip', content: 'Im BrokerPilot kannst du Zeitraeume waehlen: 1 Tag, 5 Tage, 1 Monat, 3 Monate, 6 Monate, 1 Jahr. Fuer langfristige Trends nutze 6M oder 1J.' },
    ],
  },
  'markt-3': {
    title: 'Indizes verstehen (DAX, S&P 500)',
    sections: [
      { type: 'text', content: 'Ein Aktienindex fasst viele Einzelaktien in einer Zahl zusammen. So siehst du auf einen Blick, wie sich ein ganzer Markt entwickelt.' },
      { type: 'list', items: ['DAX 40: Die 40 groessten deutschen Unternehmen (SAP, Siemens, Allianz, BMW...)', 'Euro Stoxx 50: Die 50 groessten Unternehmen der Eurozone', 'S&P 500: Die 500 groessten US-Unternehmen', 'NASDAQ: US-Tech-Boerse (Apple, Microsoft, NVIDIA, Google, Amazon)', 'Dow Jones: 30 US-Blue-Chips'] },
      { type: 'text', content: 'Wenn der DAX um +1% steigt, heisst das: Die grossen deutschen Aktien sind im Schnitt um 1% gestiegen.' },
    ],
  },
  'markt-4': {
    title: 'Krypto-Basics: Bitcoin & Co.',
    sections: [
      { type: 'text', content: 'Kryptowaehrungen sind digitales Geld, das auf Blockchain-Technologie basiert. Anders als Aktien werden Kryptos 24/7 gehandelt — auch am Wochenende und nachts.' },
      { type: 'list', items: ['Bitcoin (BTC): Die erste und groesste Kryptowaehrung, "digitales Gold"', 'Ethereum (ETH): Plattform fuer Smart Contracts und DeFi', 'Solana (SOL): Schnelle Blockchain fuer dezentrale Apps', 'XRP: Fuer schnelle internationale Zahlungen', 'Stablecoins (USDT, USDC): An den US-Dollar gekoppelt, kaum Volatilitaet'] },
      { type: 'tip', content: 'Krypto ist sehr volatil! 5-10% Tagesschwankungen sind normal. Im BrokerPilot siehst du Krypto unter "Markt" → "Krypto"-Tab.' },
    ],
  },
  'markt-5': {
    title: 'Markt-Intelligence nutzen',
    sections: [
      { type: 'text', content: 'Die Markt-Intelligence in BrokerPilot gibt dir einen taeglichen Ueberblick: Welche Maerkte steigen oder fallen, welche Aktien die groessten Gewinner und Verlierer sind, und wo es Breakout-Signale gibt.' },
      { type: 'list', items: ['Top Gewinner: Aktien/Kryptos mit den groessten Tagesgewinnen', 'Top Verlierer: Wo es Verluste gibt — Vorsicht oder Kaufgelegenheit?', 'Breakout-Signale: Kurse, die ihr 52-Wochen-Hoch/Tief durchbrechen', 'Warnungen: Ungewoehnliche Kursbewegungen (>5%)'] },
      { type: 'tip', content: 'Schau jeden Morgen auf die Markt-Intelligence — so bist du in 30 Sekunden auf dem neuesten Stand!' },
    ],
  },
};

// For lessons without specific content, generate a placeholder
function getDefaultContent(lesson) {
  return {
    title: lesson.title,
    sections: [
      { type: 'text', content: `Diese Lektion behandelt: ${lesson.title}. Inhalt wird bald erweitert.` },
      { type: 'tip', content: 'Markiere die Lektion als abgeschlossen, um deinen Fortschritt zu tracken!' },
    ],
  };
}

export function LessonViewer({ lesson, onBack }) {
  const { completeLesson, completedLessons } = useLearningStore();
  const isDone = completedLessons.includes(lesson.id);
  const content = LESSON_CONTENT[lesson.id] || getDefaultContent(lesson);

  return (
    <div className="lesson-viewer">
      <GlassButton variant="default" onClick={onBack} className="lesson-viewer__back">
        ← Zurueck zur Academy
      </GlassButton>

      <GlassCard hoverable={false} className="lesson-viewer__card">
        <h2 className="lesson-viewer__title">{content.title}</h2>
        <span className="lesson-viewer__duration">{lesson.duration}</span>

        <div className="lesson-viewer__content">
          {content.sections.map((section, i) => {
            switch (section.type) {
              case 'text':
                return <p key={i} className="lesson-viewer__text">{section.content}</p>;
              case 'example':
                return (
                  <div key={i} className="lesson-viewer__example">
                    <strong>💡 Beispiel:</strong> {section.content}
                  </div>
                );
              case 'tip':
                return (
                  <div key={i} className="lesson-viewer__tip">
                    <strong>🎯 Tipp:</strong> {section.content}
                  </div>
                );
              case 'list':
                return (
                  <ul key={i} className="lesson-viewer__list">
                    {section.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="lesson-viewer__actions">
          {isDone ? (
            <GlassBadge variant="low">✅ Abgeschlossen</GlassBadge>
          ) : (
            <GlassButton variant="primary" onClick={() => completeLesson(lesson.id)}>
              ✓ Lektion abschliessen
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
