import { Link } from 'react-router';

function LegalLayout({ title, children }) {
  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <Link to="/welcome" className="legal-page__back">
          {'←'} Zurück zur Startseite
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

      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        BrokerPilot GmbH<br />
        [Straße und Hausnummer]<br />
        [PLZ Ort]<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: [Telefonnummer]<br />
        E-Mail: info@brokerpilot.de
      </p>

      <h2>Vertreten durch</h2>
      <p>[Geschäftsführer/in Name]</p>

      <h2>Registereintrag</h2>
      <p>
        Eintragung im Handelsregister.<br />
        Registergericht: [Amtsgericht]<br />
        Registernummer: [HRB-Nummer]
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
        [USt-IdNr.]
      </p>

      <h2>Haftungsausschluss</h2>
      <h3>Haftung für Inhalte</h3>
      <p>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
        Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
        können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind
        wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach
        den allgemeinen Gesetzen verantwortlich.
      </p>

      <h3>Haftung für Links</h3>
      <p>
        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
        Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
        fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
        verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
        Seiten verantwortlich.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
        Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
        Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
        Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
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
    <LegalLayout title="Datenschutzerklärung">
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
        an unseren Server übermittelt (sog. Server-Logfiles):
      </p>
      <ul>
        <li>IP-Adresse</li>
        <li>Datum und Uhrzeit der Anfrage</li>
        <li>Zeitzonendifferenz zur Greenwich Mean Time (GMT)</li>
        <li>Inhalt der Anforderung (konkrete Seite)</li>
        <li>Zugriffsstatus/HTTP-Statuscode</li>
        <li>jeweils übertragene Datenmenge</li>
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
        <li>Erfüllung gesetzlicher Pflichten</li>
      </ul>

      <h2>4. Weitergabe an Dritte</h2>
      <p>
        Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den
        im Folgenden aufgeführten Zwecken findet nicht statt. Wir geben Ihre
        persönlichen Daten nur an Dritte weiter, wenn Sie Ihre
        ausdrückliche Einwilligung erteilt haben, die Verarbeitung zur
        Abwicklung eines Vertrags erforderlich ist, oder ein gesetzlich
        vorgesehener Fall vorliegt.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die
        auf Ihrem Endgerät gespeichert werden. Einige Cookies sind technisch
        notwendig, andere werden für die Analyse und Verbesserung unseres
        Angebots eingesetzt. Sie können Ihre Cookie-Einstellungen jederzeit
        über den Cookie-Banner anpassen.
      </p>
      <p>Wir unterscheiden folgende Cookie-Kategorien:</p>
      <ul>
        <li><strong>Notwendige Cookies:</strong> Für den technischen Betrieb der Website erforderlich.</li>
        <li><strong>Analyse-Cookies:</strong> Helfen uns, das Nutzerverhalten zu verstehen und unsere Website zu verbessern.</li>
        <li><strong>Marketing-Cookies:</strong> Werden verwendet, um Ihnen relevante Werbung anzuzeigen.</li>
      </ul>

      <h2>6. Rechte der Betroffenen (DSGVO Art. 15–21)</h2>
      <p>Sie haben das Recht:</p>
      <ul>
        <li>gemäß Art. 15 DSGVO Auskunft über Ihre verarbeiteten personenbezogenen Daten zu verlangen;</li>
        <li>gemäß Art. 16 DSGVO unverzüglich die Berichtigung unrichtiger Daten zu verlangen;</li>
        <li>gemäß Art. 17 DSGVO die Löschung Ihrer gespeicherten Daten zu verlangen;</li>
        <li>gemäß Art. 18 DSGVO die Einschränkung der Verarbeitung zu verlangen;</li>
        <li>gemäß Art. 20 DSGVO Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten;</li>
        <li>gemäß Art. 21 DSGVO Widerspruch gegen die Verarbeitung einzulegen.</li>
      </ul>

      <h2>7. SSL-Verschlüsselung</h2>
      <p>
        Unsere Website nutzt aus Sicherheitsgründen und zum Schutz der
        Übertragung vertraulicher Inhalte eine SSL-Verschlüsselung. Sie
        erkennen eine verschlüsselte Verbindung an der Adresszeile des Browsers,
        die von „http://“ auf „https://“ wechselt, und am Schloss-Symbol in Ihrer
        Browserzeile.
      </p>

      <h2>8. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir behalten uns vor, diese Datenschutzerklärung gelegentlich anzupassen,
        damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder
        um Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch
        gilt dann die neue Datenschutzerklärung.
      </p>
    </LegalLayout>
  );
}

/* ========================================================================== */
/*  AGB                                                                        */
/* ========================================================================== */
export function AGBPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen">
      <p className="legal-page__updated">Stand: April 2026</p>

      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle
        Vertragsverhältnisse zwischen der BrokerPilot GmbH (nachfolgend
        „Anbieter“) und dem Nutzer der SaaS-Plattform BrokerPilot (nachfolgend
        „Kunde“). Abweichende Bedingungen des Kunden werden nicht anerkannt,
        es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
      </p>

      <h2>2. Vertragsschluss</h2>
      <p>
        Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform
        und die Bestätigung durch den Anbieter zustande. Mit der Registrierung
        akzeptiert der Kunde diese AGB.
      </p>

      <h2>3. Leistungsbeschreibung</h2>
      <p>
        Der Anbieter stellt dem Kunden eine webbasierte CRM-Software als
        Software-as-a-Service (SaaS) zur Verfügung. Der genaue Leistungsumfang
        ergibt sich aus der jeweils gewählten Preisstufe. Der Anbieter behält
        sich vor, die Software fortlaufend weiterzuentwickeln und zu verbessern.
      </p>

      <h2>4. Preise und Zahlung</h2>
      <p>
        Die aktuell gültigen Preise sind auf der Website des Anbieters
        einsehbar. Alle Preise verstehen sich in Euro und zuzüglich der
        gesetzlichen Mehrwertsteuer, soweit nicht anders angegeben. Die Zahlung
        erfolgt im Voraus per Kreditkarte oder Lastschrift.
      </p>

      <h2>5. Laufzeit und Kündigung</h2>
      <p>
        Der kostenlose Tarif kann jederzeit ohne Angabe von Gründen beendet
        werden. Kostenpflichtige Tarife haben eine Mindestlaufzeit von einem
        Monat und verlängern sich automatisch um jeweils einen weiteren Monat,
        sofern nicht mit einer Frist von 14 Tagen zum Monatsende gekündigt wird.
        Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
        unberührt.
      </p>

      <h2>6. Haftung</h2>
      <p>
        Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
        Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung
        wesentlicher Vertragspflichten und der Höhe nach begrenzt auf den
        vorhersehbaren, vertragstypischen Schaden. Die Haftung für
        Datenverluste wird auf den typischen Wiederherstellungsaufwand begrenzt.
      </p>

      <h2>7. Datenschutz</h2>
      <p>
        Der Anbieter verarbeitet personenbezogene Daten des Kunden
        ausschließlich im Rahmen der geltenden Datenschutzgesetze. Einzelheiten
        regelt die <Link to="/datenschutz">Datenschutzerklärung</Link>.
      </p>

      <h2>8. Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist,
        soweit gesetzlich zulässig, der Sitz des Anbieters. Sollten einzelne
        Bestimmungen dieser AGB unwirksam sein, berührt dies die Wirksamkeit
        der übrigen Bestimmungen nicht.
      </p>
    </LegalLayout>
  );
}
