/**
 * Finance & CRM Glossary — German explanations for all technical terms.
 * Used by GlossaryTooltip and LearningHub components.
 *
 * Categories: crm, markt, krypto, finanzen, ki, logistik
 */
export const GLOSSARY = {
  // --- CRM & Vertrieb ---
  'Lead': {
    term: 'Lead',
    short: 'Ein potenzieller Kunde, der Interesse gezeigt hat.',
    full: 'Ein Lead ist eine Person oder Firma, die Interesse an deinem Angebot zeigt — z.B. durch eine Anfrage, Website-Besuch oder Empfehlung. Leads werden im CRM erfasst und durch die Pipeline gefuehrt, bis sie zum Abschluss kommen oder als "verloren" markiert werden.',
    category: 'crm',
    level: 'einsteiger',
  },
  'Pipeline': {
    term: 'Pipeline',
    short: 'Visualisierung aller Deals in verschiedenen Verkaufsphasen.',
    full: 'Die Sales Pipeline zeigt dir auf einen Blick, wo jeder Deal steht: Anfrage → Besichtigung → Angebot → Finanzierung → Notartermin → Abschluss. So erkennst du Engpaesse und kannst Prioritaeten setzen. Eine gesunde Pipeline hat in jeder Stage genuegend Deals.',
    category: 'crm',
    level: 'einsteiger',
  },
  'Lead-Scoring': {
    term: 'Lead-Scoring',
    short: 'Automatische Bewertung, wie "heiss" ein Lead ist.',
    full: 'Lead-Scoring vergibt Punkte basierend auf: Deal-Wert, Aktivitaet (E-Mails geoeffnet, Termine wahrgenommen), Reaktionszeit, Pipeline-Stage und Tags. Ein hoher Score (80-100) = "Hot Lead" = sofort kontaktieren. Niedriger Score = langfristig pflegen.',
    category: 'crm',
    level: 'einsteiger',
  },
  'Conversion Rate': {
    term: 'Conversion Rate',
    short: 'Prozentsatz der Leads, die zu Kunden werden.',
    full: 'Conversion Rate = Abschluesse ÷ Leads × 100. Beispiel: 5 Abschluesse aus 100 Leads = 5% Conversion. Im Immobilienbereich sind 2-5% normal. Durch besseres Lead-Scoring und schnellere Follow-ups laesst sich die Rate steigern.',
    category: 'crm',
    level: 'fortgeschritten',
  },
  'Deal Value': {
    term: 'Deal Value',
    short: 'Der erwartete Umsatzwert eines Deals.',
    full: 'Der Deal Value ist der geschaetzte Wert eines Abschlusses in Euro. Bei Immobilien oft der Kaufpreis oder die Provision. Die Summe aller Deal Values in der Pipeline ergibt den "Pipeline Value" — ein wichtiger KPI fuer die Umsatzplanung.',
    category: 'crm',
    level: 'einsteiger',
  },
  'Drip-Kampagne': {
    term: 'Drip-Kampagne',
    short: 'Automatische E-Mail-Serie ueber mehrere Tage/Wochen.',
    full: 'Eine Drip-Kampagne sendet vorbereitete E-Mails in festgelegten Intervallen: Tag 1 Willkommen, Tag 3 Follow-up, Tag 7 Angebot. So bleibst du im Kontakt, ohne jeden Lead manuell anschreiben zu muessen. BrokerPilot unterstuetzt KI-personalisierte Drip-Kampagnen.',
    category: 'crm',
    level: 'fortgeschritten',
  },
  'Workflow': {
    term: 'Workflow',
    short: 'Automatisierte Abfolge von Aktionen bei bestimmten Ereignissen.',
    full: 'Ein Workflow wird durch ein Ereignis ausgeloest (z.B. "Neuer Lead erstellt") und fuehrt dann automatisch Schritte aus: E-Mail senden, Tag hinzufuegen, Erinnerung erstellen, Teammitglied zuweisen. Spart bis zu 10h pro Woche.',
    category: 'crm',
    level: 'fortgeschritten',
  },

  // --- Markt & Aktien ---
  'Aktie': {
    term: 'Aktie',
    short: 'Ein Anteil an einem Unternehmen, der an der Boerse gehandelt wird.',
    full: 'Wenn du eine Aktie kaufst, gehoert dir ein kleiner Teil des Unternehmens. Der Kurs steigt, wenn viele kaufen wollen (Nachfrage hoch), und faellt, wenn viele verkaufen. Grosse Unternehmen wie SAP, Apple oder NVIDIA sind an der Boerse gelistet.',
    category: 'markt',
    level: 'einsteiger',
  },
  'Index': {
    term: 'Index (Aktienindex)',
    short: 'Zusammenfassung der Performance vieler Aktien in einer Zahl.',
    full: 'Ein Aktienindex misst die Gesamtperformance eines Marktes. Der DAX 40 bildet die 40 groessten deutschen Aktien ab, der S&P 500 die 500 groessten US-Unternehmen. Steigt der DAX, geht es der deutschen Wirtschaft tendenziell gut.',
    category: 'markt',
    level: 'einsteiger',
  },
  'Candlestick': {
    term: 'Candlestick (Kerze)',
    short: 'Chartdarstellung mit Eroeffnungs-, Hoechst-, Tiefst- und Schlusskurs.',
    full: 'Ein Candlestick zeigt 4 Werte fuer einen Zeitraum: Open (Eroeffnung), High (Hoechst), Low (Tiefst), Close (Schluss). Gruen = Kurs gestiegen (Close > Open). Rot = Kurs gefallen. Der "Docht" zeigt die Spanne zwischen High/Low. Profis lesen Muster wie "Hammer" oder "Doji".',
    category: 'markt',
    level: 'einsteiger',
  },
  'Breakout': {
    term: 'Breakout',
    short: 'Kurs durchbricht ein wichtiges Niveau (z.B. 52-Wochen-Hoch).',
    full: 'Ein Breakout entsteht, wenn ein Kurs ueber einen Widerstand (obere Grenze) oder unter eine Unterstuetzung (untere Grenze) bricht. Ein Breakout ueber das 52-Wochen-Hoch signalisiert oft den Start eines neuen Aufwaertstrends. BrokerPilot erkennt Breakouts automatisch.',
    category: 'markt',
    level: 'fortgeschritten',
  },
  'SMA': {
    term: 'SMA (Simple Moving Average)',
    short: 'Gleitender Durchschnitt ueber einen bestimmten Zeitraum.',
    full: 'Der SMA50 ist der Durchschnittskurs der letzten 50 Tage. Liegt der aktuelle Kurs ueber dem SMA50, ist der Trend positiv. Wenn der SMA20 den SMA50 von unten nach oben kreuzt ("Golden Cross"), ist das ein Kaufsignal.',
    category: 'markt',
    level: 'profi',
  },
  'Volatilitaet': {
    term: 'Volatilitaet',
    short: 'Mass fuer die Schwankungsbreite eines Kurses.',
    full: 'Hohe Volatilitaet = grosse Kursschwankungen = mehr Risiko, aber auch mehr Chance. Bitcoin hat z.B. sehr hohe Volatilitaet (kann 10% am Tag schwanken), waehrend DAX-Aktien meist 1-3% schwanken. Profi-Tipp: Volatilitaet steigt oft vor wichtigen Nachrichten.',
    category: 'markt',
    level: 'fortgeschritten',
  },
  'P/E Ratio': {
    term: 'P/E Ratio (KGV)',
    short: 'Kurs-Gewinn-Verhaeltnis — wie "teuer" eine Aktie ist.',
    full: 'P/E = Aktienkurs ÷ Gewinn pro Aktie. Ein P/E von 15 bedeutet: Du zahlst 15 EUR fuer jeden 1 EUR Gewinn. Unter 15 gilt als guenstig, ueber 25 als teuer. Tech-Aktien haben oft hohe P/Es (50+), weil Wachstum eingepreist ist.',
    category: 'finanzen',
    level: 'fortgeschritten',
  },

  // --- Krypto ---
  'Bitcoin': {
    term: 'Bitcoin (BTC)',
    short: 'Die erste und groesste Kryptowaehrung.',
    full: 'Bitcoin wurde 2009 von Satoshi Nakamoto erfunden. Es ist digitales Geld ohne Zentralbank — Transaktionen werden in einer Blockchain gespeichert. Max. 21 Mio. BTC koennen existieren (Knappheit). Bitcoin wird 24/7 gehandelt, auch am Wochenende.',
    category: 'krypto',
    level: 'einsteiger',
  },
  'Market Cap': {
    term: 'Market Cap (Marktkapitalisierung)',
    short: 'Gesamtwert aller Coins/Aktien eines Unternehmens.',
    full: 'Market Cap = Preis × Umlaufmenge. Bitcoin mit 82.000 EUR und ~19.5 Mio. Coins = ~1.6 Billionen EUR Market Cap. Je hoeher die Market Cap, desto stabiler und weniger manipulierbar ist ein Asset. "Large Cap" > 10 Mrd., "Small Cap" < 1 Mrd.',
    category: 'krypto',
    level: 'einsteiger',
  },
  'Blockchain': {
    term: 'Blockchain',
    short: 'Dezentrale, faelschungssichere Datenbank fuer Transaktionen.',
    full: 'Eine Blockchain ist eine Kette von Datenbloecken, die kryptographisch miteinander verbunden sind. Jede Transaktion wird von tausenden Computern weltweit verifiziert. Einmal gespeichert, kann nichts mehr geaendert werden. Ethereum erweitert das Konzept um "Smart Contracts" — programmierbare Vertraege.',
    category: 'krypto',
    level: 'einsteiger',
  },
  'DeFi': {
    term: 'DeFi (Dezentrale Finanzen)',
    short: 'Finanzdienstleistungen ohne Bank — nur mit Smart Contracts.',
    full: 'DeFi ermoeglicht Kreditvergabe, Handel und Zinsen ohne traditionelle Banken. Alles laeuft ueber Smart Contracts auf der Blockchain. Uniswap (UNI) ist eine dezentrale Boerse, Aave ein Kreditprotokoll. Vorteile: 24/7, global, keine Mindestbetraege. Risiko: Smart Contract Bugs, Volatilitaet.',
    category: 'krypto',
    level: 'profi',
  },

  // --- Finanzkennzahlen ---
  'KPI': {
    term: 'KPI (Key Performance Indicator)',
    short: 'Wichtigste Kennzahl zur Messung des Erfolgs.',
    full: 'KPIs messen, ob du deine Ziele erreichst. Im Vertrieb: Conversion Rate, Avg. Deal Size, Sales Cycle Length, Revenue. In der Logistik: Lieferquote, Frachtkosten/Tonne, Durchlaufzeit. BrokerPilot zeigt deine KPIs im Analytics-Dashboard.',
    category: 'finanzen',
    level: 'einsteiger',
  },
  'ROI': {
    term: 'ROI (Return on Investment)',
    short: 'Rendite einer Investition in Prozent.',
    full: 'ROI = (Gewinn - Investition) ÷ Investition × 100. Beispiel: 10.000 EUR investiert, 12.000 EUR zurueck = 20% ROI. Ein positiver ROI bedeutet Gewinn, ein negativer Verlust. Beim Immobilienkauf zaehlen Mietrendite + Wertsteigerung.',
    category: 'finanzen',
    level: 'fortgeschritten',
  },
  'Diversifikation': {
    term: 'Diversifikation',
    short: 'Risikostreuung durch Verteilung auf verschiedene Anlagen.',
    full: '"Lege nicht alle Eier in einen Korb." Diversifikation bedeutet: Investiere in verschiedene Branchen, Laender und Anlageklassen (Aktien, Immobilien, Krypto, Anleihen). Wenn eine Anlage faellt, gleichen andere den Verlust aus. Ein gut diversifiziertes Portfolio hat geringere Volatilitaet.',
    category: 'finanzen',
    level: 'fortgeschritten',
  },

  // --- KI ---
  'SWOT-Analyse': {
    term: 'SWOT-Analyse',
    short: 'Methode zur Bewertung: Staerken, Schwaechen, Chancen, Risiken.',
    full: 'SWOT steht fuer Strengths, Weaknesses, Opportunities, Threats. BrokerPilot generiert SWOT-Analysen per KI fuer jeden Lead oder Deal: Wo liegen die Staerken dieses Deals? Welche Risiken gibt es? Welche Marktchancen kann man nutzen?',
    category: 'ki',
    level: 'fortgeschritten',
  },
  'RAG': {
    term: 'RAG (Retrieval Augmented Generation)',
    short: 'KI, die auf eigene Daten zugreift statt nur auf Trainingsdaten.',
    full: 'Normale KI wie ChatGPT kennt nur ihre Trainingsdaten. RAG verbindet KI mit deiner eigenen Datenbank — so kann sie Fragen zu deinen Leads, Deals und Marktdaten beantworten. BrokerPilot nutzt RAG, um KI-Agenten Zugriff auf dein CRM zu geben.',
    category: 'ki',
    level: 'profi',
  },
};

/** Get glossary entries filtered by category and/or level */
export function getGlossaryByCategory(category) {
  return Object.values(GLOSSARY).filter((g) => g.category === category);
}

export function getGlossaryByLevel(level) {
  return Object.values(GLOSSARY).filter((g) => g.level === level);
}

/** Search glossary by term */
export function searchGlossary(query) {
  const q = query.toLowerCase();
  return Object.values(GLOSSARY).filter(
    (g) => g.term.toLowerCase().includes(q) || g.short.toLowerCase().includes(q)
  );
}
