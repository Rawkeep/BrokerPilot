import { Link } from 'react-router';

function LegalLayout({ title, children }) {
  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <Link to="/welcome" className="legal-page__back">
          {'\u2190'} Zur\u00FCck zur Startseite
        </Link>
        <h1 className="legal-page__title">{title}</h1>
        {children}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Impressum                                                                  */
/* ========================================================================== */
export function ImpressumPage() {
  return (
    <LegalLayout title="Impressum">
      <p className="legal-page__updated">Stand: April 2026</p>

      <h2>Angaben gem\u00E4\u00DF \u00A7 5 TMG</h2>
      <p>
        BrokerPilot GmbH<br />
        [Stra\u00DFe und Hausnummer]<br />
        [PLZ Ort]<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: [Telefonnummer]<br />
        E-Mail: info@brokerpilot.de
      </p>

      <h2>Vertreten durch</h2>
      <p>[Gesch\u00E4ftsf\u00FChrer/in Name]</p>

      <h2>Registereintrag</h2>
      <p>
        Eintragung im Handelsregister.<br />
        Registergericht: [Amtsgericht]<br />
        Registernummer: [HRB-Nummer]
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gem\u00E4\u00DF \u00A727 a Umsatzsteuergesetz:<br />
        [USt-IdNr.]
      </p>

      <h2>Haftungsausschluss</h2>
      <h3>Haftung f\u00FCr Inhalte</h3>
      <p>
        Die Inhalte unserer Seiten wurden mit gr\u00F6\u00DFter Sorgfalt erstellt.
        F\u00FCr die Richtigkeit, Vollst\u00E4ndigkeit und Aktualit\u00E4t der Inhalte
        k\u00F6nnen wir jedoch keine Gew\u00E4hr \u00FCbernehmen. Als Diensteanbieter sind
        wir gem\u00E4\u00DF \u00A7 7 Abs.1 TMG f\u00FCr eigene Inhalte auf diesen Seiten nach
        den allgemeinen Gesetzen verantwortlich.
      </p>

      <h3>Haftung f\u00FCr Links</h3>
      <p>
        Unser Angebot enth\u00E4lt Links zu externen Webseiten Dritter, auf deren
        Inhalte wir keinen Einfluss haben. Deshalb k\u00F6nnen wir f\u00FCr diese
        fremden Inhalte auch keine Gew\u00E4hr \u00FCbernehmen. F\u00FCr die Inhalte der
        verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
        Seiten verantwortlich.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
        Seiten unterliegen dem deutschen Urheberrecht. Die Vervielf\u00E4ltigung,
        Bearbeitung, Verbreitung und jede Art der Verwertung au\u00DFerhalb der
        Grenzen des Urheberrechtes bed\u00FCrfen der schriftlichen Zustimmung des
        jeweiligen Autors bzw. Erstellers.
      </p>
    </LegalLayout>
  );
}

/* ========================================================================== */
/*  Datenschutz                                                                */
/* ========================================================================== */
export function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutzerkl\u00E4rung">
      <p className="legal-page__updated">Stand: April 2026</p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO):<br />
        BrokerPilot GmbH<br />
        [Adresse]<br />
        E-Mail: datenschutz@brokerpilot.de
      </p>

      <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
      <p>
        Beim Besuch unserer Website erheben wir folgende Daten, die Ihr Browser
        an unseren Server \u00FCbermittelt (sog. Server-Logfiles):
      </p>
      <ul>
        <li>IP-Adresse</li>
        <li>Datum und Uhrzeit der Anfrage</li>
        <li>Zeitzonendifferenz zur Greenwich Mean Time (GMT)</li>
        <li>Inhalt der Anforderung (konkrete Seite)</li>
        <li>Zugriffsstatus/HTTP-Statuscode</li>
        <li>jeweils \u00FCbertragene Datenmenge</li>
        <li>Referrer-URL</li>
        <li>Browser und Betriebssystem</li>
      </ul>

      <h2>3. Verwendungszwecke</h2>
      <p>Wir verarbeiten Ihre personenbezogenen Daten zu folgenden Zwecken:</p>
      <ul>
        <li>Bereitstellung und Verbesserung unseres Online-Angebots</li>
        <li>Beantwortung von Kontaktanfragen</li>
        <li>Nutzungsanalyse zur Optimierung unserer Website</li>
        <li>Vertragsabwicklung und Kundenbetreuung</li>
        <li>Erf\u00FCllung gesetzlicher Pflichten</li>
      </ul>

      <h2>4. Weitergabe an Dritte</h2>
      <p>
        Eine \u00DCbermittlung Ihrer pers\u00F6nlichen Daten an Dritte zu anderen als den
        im Folgenden aufgef\u00FChrten Zwecken findet nicht statt. Wir geben Ihre
        pers\u00F6nlichen Daten nur an Dritte weiter, wenn Sie Ihre
        ausdr\u00FCckliche Einwilligung erteilt haben, die Verarbeitung zur
        Abwicklung eines Vertrags erforderlich ist, oder ein gesetzlich
        vorgesehener Fall vorliegt.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die
        auf Ihrem Endger\u00E4t gespeichert werden. Einige Cookies sind technisch
        notwendig, andere werden f\u00FCr die Analyse und Verbesserung unseres
        Angebots eingesetzt. Sie k\u00F6nnen Ihre Cookie-Einstellungen jederzeit
        \u00FCber den Cookie-Banner anpassen.
      </p>
      <p>Wir unterscheiden folgende Cookie-Kategorien:</p>
      <ul>
        <li><strong>Notwendige Cookies:</strong> F\u00FCr den technischen Betrieb der Website erforderlich.</li>
        <li><strong>Analyse-Cookies:</strong> Helfen uns, das Nutzerverhalten zu verstehen und unsere Website zu verbessern.</li>
        <li><strong>Marketing-Cookies:</strong> Werden verwendet, um Ihnen relevante Werbung anzuzeigen.</li>
      </ul>

      <h2>6. Rechte der Betroffenen (DSGVO Art. 15\u201321)</h2>
      <p>Sie haben das Recht:</p>
      <ul>
        <li>gem\u00E4\u00DF Art. 15 DSGVO Auskunft \u00FCber Ihre verarbeiteten personenbezogenen Daten zu verlangen;</li>
        <li>gem\u00E4\u00DF Art. 16 DSGVO unverz\u00FCglich die Berichtigung unrichtiger Daten zu verlangen;</li>
        <li>gem\u00E4\u00DF Art. 17 DSGVO die L\u00F6schung Ihrer gespeicherten Daten zu verlangen;</li>
        <li>gem\u00E4\u00DF Art. 18 DSGVO die Einschr\u00E4nkung der Verarbeitung zu verlangen;</li>
        <li>gem\u00E4\u00DF Art. 20 DSGVO Ihre Daten in einem strukturierten, g\u00E4ngigen und maschinenlesbaren Format zu erhalten;</li>
        <li>gem\u00E4\u00DF Art. 21 DSGVO Widerspruch gegen die Verarbeitung einzulegen.</li>
      </ul>

      <h2>7. SSL-Verschl\u00FCsselung</h2>
      <p>
        Unsere Website nutzt aus Sicherheitsgr\u00FCnden und zum Schutz der
        \u00DCbertragung vertraulicher Inhalte eine SSL-Verschl\u00FCsselung. Sie
        erkennen eine verschl\u00FCsselte Verbindung an der Adresszeile des Browsers,
        die von \u201Ehttp://\u201C auf \u201Ehttps://\u201C wechselt, und am Schloss-Symbol in Ihrer
        Browserzeile.
      </p>

      <h2>8. \u00C4nderungen dieser Datenschutzerkl\u00E4rung</h2>
      <p>
        Wir behalten uns vor, diese Datenschutzerkl\u00E4rung gelegentlich anzupassen,
        damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder
        um \u00C4nderungen unserer Leistungen umzusetzen. F\u00FCr Ihren erneuten Besuch
        gilt dann die neue Datenschutzerkl\u00E4rung.
      </p>
    </LegalLayout>
  );
}

/* ========================================================================== */
/*  AGB                                                                        */
/* ========================================================================== */
export function AGBPage() {
  return (
    <LegalLayout title="Allgemeine Gesch\u00E4ftsbedingungen">
      <p className="legal-page__updated">Stand: April 2026</p>

      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Gesch\u00E4ftsbedingungen (AGB) gelten f\u00FCr alle
        Vertragsverh\u00E4ltnisse zwischen der BrokerPilot GmbH (nachfolgend
        \u201EAnbieter\u201C) und dem Nutzer der SaaS-Plattform BrokerPilot (nachfolgend
        \u201EKunde\u201C). Abweichende Bedingungen des Kunden werden nicht anerkannt,
        es sei denn, der Anbieter stimmt ihrer Geltung ausdr\u00FCcklich schriftlich zu.
      </p>

      <h2>2. Vertragsschluss</h2>
      <p>
        Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform
        und die Best\u00E4tigung durch den Anbieter zustande. Mit der Registrierung
        akzeptiert der Kunde diese AGB.
      </p>

      <h2>3. Leistungsbeschreibung</h2>
      <p>
        Der Anbieter stellt dem Kunden eine webbasierte CRM-Software als
        Software-as-a-Service (SaaS) zur Verf\u00FCgung. Der genaue Leistungsumfang
        ergibt sich aus der jeweils gew\u00E4hlten Preisstufe. Der Anbieter beh\u00E4lt
        sich vor, die Software fortlaufend weiterzuentwickeln und zu verbessern.
      </p>

      <h2>4. Preise und Zahlung</h2>
      <p>
        Die aktuell g\u00FCltigen Preise sind auf der Website des Anbieters
        einsehbar. Alle Preise verstehen sich in Euro und zuz\u00FCglich der
        gesetzlichen Mehrwertsteuer, soweit nicht anders angegeben. Die Zahlung
        erfolgt im Voraus per Kreditkarte oder Lastschrift.
      </p>

      <h2>5. Laufzeit und K\u00FCndigung</h2>
      <p>
        Der kostenlose Tarif kann jederzeit ohne Angabe von Gr\u00FCnden beendet
        werden. Kostenpflichtige Tarife haben eine Mindestlaufzeit von einem
        Monat und verl\u00E4ngern sich automatisch um jeweils einen weiteren Monat,
        sofern nicht mit einer Frist von 14 Tagen zum Monatsende gek\u00FCndigt wird.
        Das Recht zur au\u00DFerordentlichen K\u00FCndigung aus wichtigem Grund bleibt
        unber\u00FChrt.
      </p>

      <h2>6. Haftung</h2>
      <p>
        Der Anbieter haftet unbeschr\u00E4nkt f\u00FCr Vorsatz und grobe Fahrl\u00E4ssigkeit.
        Bei leichter Fahrl\u00E4ssigkeit haftet der Anbieter nur bei Verletzung
        wesentlicher Vertragspflichten und der H\u00F6he nach begrenzt auf den
        vorhersehbaren, vertragstypischen Schaden. Die Haftung f\u00FCr
        Datenverluste wird auf den typischen Wiederherstellungsaufwand begrenzt.
      </p>

      <h2>7. Datenschutz</h2>
      <p>
        Der Anbieter verarbeitet personenbezogene Daten des Kunden
        ausschlie\u00DFlich im Rahmen der geltenden Datenschutzgesetze. Einzelheiten
        regelt die <Link to="/datenschutz">Datenschutzerkl\u00E4rung</Link>.
      </p>

      <h2>8. Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist,
        soweit gesetzlich zul\u00E4ssig, der Sitz des Anbieters. Sollten einzelne
        Bestimmungen dieser AGB unwirksam sein, ber\u00FChrt dies die Wirksamkeit
        der \u00FCbrigen Bestimmungen nicht.
      </p>
    </LegalLayout>
  );
}
