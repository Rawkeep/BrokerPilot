/**
 * Email Template Engine
 *
 * Broker-type-specific email templates with placeholder rendering.
 * Templates are professional German language with inline-styled HTML
 * for maximum email client compatibility.
 *
 * Supported broker types: immobilien, krypto, finanz, versicherung, investment
 * Template categories: welcome, followup, proposal, reminder, closing
 */

// ---------------------------------------------------------------------------
// Shared HTML wrapper for all templates
// ---------------------------------------------------------------------------

const HTML_WRAPPER = (content) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e; line-height: 1.6;">
  ${content}
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
    Gesendet via BrokerPilot &mdash; <a href="{{portalLink}}" style="color: #3b82f6; text-decoration: none;">Zum Portal</a>
  </div>
</div>`;

// ---------------------------------------------------------------------------
// Template definitions per broker type
// ---------------------------------------------------------------------------

const TEMPLATES = {
  immobilien: [
    {
      id: 'immobilien-welcome',
      category: 'welcome',
      subject: 'Willkommen bei {{company}}, {{name}}!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Willkommen, {{name}}!</h2>
        <p>Vielen Dank fuer Ihr Interesse an unseren Immobilien-Dienstleistungen. Wir freuen uns, Sie als neuen Kunden bei <strong>{{company}}</strong> begruessen zu duerfen.</p>
        <p>Ihr persoenlicher Berater <strong>{{brokerName}}</strong> steht Ihnen ab sofort zur Verfuegung, um gemeinsam die perfekte Immobilie fuer Sie zu finden.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3b82f6; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Zum Kundenportal</a>
      `),
    },
    {
      id: 'immobilien-followup',
      category: 'followup',
      subject: 'Nachbesprechung: Ihre Immobiliensuche, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Hallo {{name}},</h2>
        <p>es war mir eine Freude, unser Erstgespraech mit Ihnen zu fuehren. Wie besprochen fasse ich hier die wichtigsten Punkte zusammen.</p>
        <p>Basierend auf Ihren Anforderungen habe ich bereits einige vielversprechende Objekte fuer Sie vorgemerkt.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <p>Bei Fragen erreichen Sie mich jederzeit.</p>
        <p style="margin-top: 16px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'immobilien-proposal',
      category: 'proposal',
      subject: 'Ihr Immobilienangebot von {{company}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Angebot fuer {{name}}</h2>
        <p>Anbei erhalten Sie unser Angebot mit einem Volumen von <strong>{{dealValue}}</strong>.</p>
        <p>Das Angebot umfasst alle besprochenen Leistungen und Konditionen. Bitte pruefen Sie die Details in Ruhe.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <strong>Angebotsvolumen:</strong> {{dealValue}}
        </div>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3b82f6; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Angebot ansehen</a>
        <p style="margin-top: 24px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong></p>
      `),
    },
    {
      id: 'immobilien-reminder',
      category: 'reminder',
      subject: 'Erinnerung: Ausstehende Aktion, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Erinnerung, {{name}}</h2>
        <p>Ich moechte Sie freundlich daran erinnern, dass noch eine Aktion Ihrerseits aussteht.</p>
        <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Ausstehend:</strong> {{nextStep}}
        </div>
        <p>Bitte lassen Sie mich wissen, falls Sie Unterstuetzung benoetigen oder sich Ihre Planung geaendert hat.</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #f59e0b; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Jetzt erledigen</a>
        <p style="margin-top: 24px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'immobilien-closing',
      category: 'closing',
      subject: 'Herzlichen Glueckwunsch, {{name}} — Abschluss erfolgreich!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Herzlichen Glueckwunsch, {{name}}!</h2>
        <p>Ich freue mich, Ihnen mitteilen zu koennen, dass Ihr Immobiliengeschaeft erfolgreich abgeschlossen wurde.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          <strong>Abschlussvolumen:</strong> {{dealValue}}
        </div>
        <p>Es war mir eine Freude, Sie auf diesem Weg zu begleiten. Fuer zukuenftige Anliegen stehe ich Ihnen weiterhin gerne zur Verfuegung.</p>
        <p style="margin-top: 24px;">Herzliche Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
  ],

  krypto: [
    {
      id: 'krypto-welcome',
      category: 'welcome',
      subject: 'Willkommen bei {{company}}, {{name}} — Ihr Krypto-Einstieg',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Willkommen, {{name}}!</h2>
        <p>Schoen, dass Sie sich fuer die Krypto-Beratung bei <strong>{{company}}</strong> entschieden haben.</p>
        <p>Ihr Berater <strong>{{brokerName}}</strong> wird Sie durch den gesamten Prozess begleiten — von der KYC-Pruefung bis zur Portfolio-Strategie.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #8b5cf6; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Zum Portal</a>
      `),
    },
    {
      id: 'krypto-followup',
      category: 'followup',
      subject: 'Follow-up: Ihre Krypto-Strategie, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Hallo {{name}},</h2>
        <p>Vielen Dank fuer unser Gespraech. Hier eine kurze Zusammenfassung der besprochenen Krypto-Strategie.</p>
        <p>Ich habe basierend auf Ihrem Risikoprofil passende Assets und Boersen fuer Sie evaluiert.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <p style="margin-top: 16px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'krypto-proposal',
      category: 'proposal',
      subject: 'Ihr Krypto-Portfolio-Vorschlag von {{company}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Portfolio-Vorschlag fuer {{name}}</h2>
        <p>Anbei Ihr individueller Portfolio-Vorschlag mit einem Investitionsvolumen von <strong>{{dealValue}}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
          <strong>Investitionsvolumen:</strong> {{dealValue}}
        </div>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #8b5cf6; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Vorschlag ansehen</a>
        <p style="margin-top: 24px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong></p>
      `),
    },
    {
      id: 'krypto-reminder',
      category: 'reminder',
      subject: 'Erinnerung: {{nextStep}}, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Erinnerung, {{name}}</h2>
        <p>Eine freundliche Erinnerung an Ihre ausstehende Aktion im Krypto-Prozess.</p>
        <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Ausstehend:</strong> {{nextStep}}
        </div>
        <p>Die Krypto-Maerkte bewegen sich schnell — zoeegern Sie nicht, falls Sie Fragen haben.</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #f59e0b; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Jetzt erledigen</a>
        <p style="margin-top: 24px;">Beste Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'krypto-closing',
      category: 'closing',
      subject: 'Glueckwunsch, {{name}} — Portfolio erfolgreich eingerichtet!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Herzlichen Glueckwunsch, {{name}}!</h2>
        <p>Ihr Krypto-Portfolio wurde erfolgreich eingerichtet. Das Gesamtvolumen betraegt <strong>{{dealValue}}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          <strong>Portfolio-Volumen:</strong> {{dealValue}}
        </div>
        <p>Ich werde die Performance weiterhin im Auge behalten und Sie regelmaessig ueber Entwicklungen informieren.</p>
        <p style="margin-top: 24px;">Beste Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
  ],

  finanz: [
    {
      id: 'finanz-welcome',
      category: 'welcome',
      subject: 'Willkommen bei {{company}}, {{name}}!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Willkommen, {{name}}!</h2>
        <p>Vielen Dank fuer Ihr Vertrauen in <strong>{{company}}</strong>. Ihr persoenlicher Finanzberater <strong>{{brokerName}}</strong> freut sich auf die Zusammenarbeit.</p>
        <p>Gemeinsam entwickeln wir eine massgeschneiderte Finanzstrategie fuer Ihre Ziele.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0ea5e9; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Zum Kundenportal</a>
      `),
    },
    {
      id: 'finanz-followup',
      category: 'followup',
      subject: 'Nachbesprechung: Ihre Finanzplanung, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Hallo {{name}},</h2>
        <p>Vielen Dank fuer unser ausfuehrliches Beratungsgespraech. Ich habe mir Ihre finanzielle Situation genau angesehen und erste Empfehlungen vorbereitet.</p>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <p style="margin-top: 16px;">Herzliche Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'finanz-proposal',
      category: 'proposal',
      subject: 'Ihr Finanzierungsangebot von {{company}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Finanzierungsangebot fuer {{name}}</h2>
        <p>Anbei Ihr persoenliches Finanzierungsangebot ueber <strong>{{dealValue}}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
          <strong>Volumen:</strong> {{dealValue}}
        </div>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0ea5e9; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Angebot ansehen</a>
        <p style="margin-top: 24px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong></p>
      `),
    },
    {
      id: 'finanz-reminder',
      category: 'reminder',
      subject: 'Erinnerung: {{nextStep}}, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Erinnerung, {{name}}</h2>
        <p>Ich moechte Sie freundlich an Ihren ausstehenden Schritt erinnern.</p>
        <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Ausstehend:</strong> {{nextStep}}
        </div>
        <p>Kontaktieren Sie mich gerne, wenn Sie Hilfe benoetigen.</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #f59e0b; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Jetzt erledigen</a>
        <p style="margin-top: 24px;">Beste Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'finanz-closing',
      category: 'closing',
      subject: 'Glueckwunsch, {{name}} — Finanzierung abgeschlossen!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Herzlichen Glueckwunsch, {{name}}!</h2>
        <p>Ihre Finanzierung ueber <strong>{{dealValue}}</strong> wurde erfolgreich abgeschlossen.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          <strong>Abschlussvolumen:</strong> {{dealValue}}
        </div>
        <p>Fuer zukuenftige Finanzfragen stehe ich Ihnen weiterhin gerne zur Seite.</p>
        <p style="margin-top: 24px;">Herzliche Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
  ],

  versicherung: [
    {
      id: 'versicherung-welcome',
      category: 'welcome',
      subject: 'Willkommen bei {{company}}, {{name}}!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Willkommen, {{name}}!</h2>
        <p>Vielen Dank, dass Sie <strong>{{company}}</strong> als Ihren Versicherungspartner gewaehlt haben.</p>
        <p>Ihr persoenlicher Berater <strong>{{brokerName}}</strong> wird eine umfassende Bedarfsanalyse fuer Sie erstellen.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #10b981; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Zum Kundenportal</a>
      `),
    },
    {
      id: 'versicherung-followup',
      category: 'followup',
      subject: 'Ihre Versicherungsberatung — Zusammenfassung, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Hallo {{name}},</h2>
        <p>Vielen Dank fuer unser Beratungsgespraech. Basierend auf Ihrer Bedarfsanalyse habe ich passende Versicherungsloesungen fuer Sie zusammengestellt.</p>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <p style="margin-top: 16px;">Herzliche Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'versicherung-proposal',
      category: 'proposal',
      subject: 'Ihr Versicherungsangebot von {{company}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Angebot fuer {{name}}</h2>
        <p>Anbei Ihr individuelles Versicherungsangebot mit einer Jahrespraemie von <strong>{{dealValue}}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
          <strong>Jahrespraemie:</strong> {{dealValue}}
        </div>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #10b981; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Angebot ansehen</a>
        <p style="margin-top: 24px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong></p>
      `),
    },
    {
      id: 'versicherung-reminder',
      category: 'reminder',
      subject: 'Erinnerung: Ausstehende Unterlagen, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Erinnerung, {{name}}</h2>
        <p>Fuer die Bearbeitung Ihrer Versicherung benoetigen wir noch ausstehende Unterlagen oder Informationen.</p>
        <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Ausstehend:</strong> {{nextStep}}
        </div>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #f59e0b; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Jetzt erledigen</a>
        <p style="margin-top: 24px;">Beste Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'versicherung-closing',
      category: 'closing',
      subject: 'Glueckwunsch, {{name}} — Versicherung abgeschlossen!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Herzlichen Glueckwunsch, {{name}}!</h2>
        <p>Ihre Versicherung wurde erfolgreich abgeschlossen. Die Jahrespraemie betraegt <strong>{{dealValue}}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          <strong>Jahrespraemie:</strong> {{dealValue}}
        </div>
        <p>Ihre Police wird Ihnen in Kuerze zugestellt. Fuer alle Fragen bin ich gerne da.</p>
        <p style="margin-top: 24px;">Herzliche Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
  ],

  investment: [
    {
      id: 'investment-welcome',
      category: 'welcome',
      subject: 'Willkommen bei {{company}}, {{name}} — Investment-Banking',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Willkommen, {{name}}!</h2>
        <p>Vielen Dank fuer Ihr Interesse an den Investment-Banking-Dienstleistungen von <strong>{{company}}</strong>.</p>
        <p>Ihr dedizierter Berater <strong>{{brokerName}}</strong> wird eine massgeschneiderte Anlagestrategie fuer Sie entwickeln.</p>
        <p style="margin-top: 24px;"><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Zum Portal</a>
      `),
    },
    {
      id: 'investment-followup',
      category: 'followup',
      subject: 'Follow-up: Ihre Anlagestrategie, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Hallo {{name}},</h2>
        <p>Nach unserem Erstgespraech habe ich Ihre Anlageziele und Risikobereitschaft analysiert und erste Strategievorschlaege erarbeitet.</p>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <p style="margin-top: 16px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'investment-proposal',
      category: 'proposal',
      subject: 'Ihr Investment-Vorschlag von {{company}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Investment-Vorschlag fuer {{name}}</h2>
        <p>Anbei Ihr persoenlicher Anlagevorschlag mit einem Volumen von <strong>{{dealValue}}</strong>.</p>
        <div style="margin: 24px 0; padding: 16px; background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 4px;">
          <strong>Anlagevolumen:</strong> {{dealValue}}
        </div>
        <p><strong>Naechster Schritt:</strong> {{nextStep}}</p>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Vorschlag ansehen</a>
        <p style="margin-top: 24px;">Mit freundlichen Gruessen,<br/><strong>{{brokerName}}</strong></p>
      `),
    },
    {
      id: 'investment-reminder',
      category: 'reminder',
      subject: 'Erinnerung: Ausstehende Entscheidung, {{name}}',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Erinnerung, {{name}}</h2>
        <p>Die Marktlage entwickelt sich dynamisch. Ich moechte Sie an Ihren ausstehenden Schritt erinnern.</p>
        <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Ausstehend:</strong> {{nextStep}}
        </div>
        <a href="{{portalLink}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #f59e0b; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">Jetzt erledigen</a>
        <p style="margin-top: 24px;">Beste Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
    {
      id: 'investment-closing',
      category: 'closing',
      subject: 'Glueckwunsch, {{name}} — Investment erfolgreich platziert!',
      body: HTML_WRAPPER(`
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Herzlichen Glueckwunsch, {{name}}!</h2>
        <p>Ihr Investment ueber <strong>{{dealValue}}</strong> wurde erfolgreich platziert.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          <strong>Investitionsvolumen:</strong> {{dealValue}}
        </div>
        <p>Ich werde die Performance Ihres Portfolios laufend monitoren und Sie ueber relevante Entwicklungen informieren.</p>
        <p style="margin-top: 24px;">Herzliche Gruesse,<br/><strong>{{brokerName}}</strong><br/>{{company}}</p>
      `),
    },
  ],
};

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 'welcome', label: 'Willkommen' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'proposal', label: 'Angebot' },
  { id: 'reminder', label: 'Erinnerung' },
  { id: 'closing', label: 'Abschluss' },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all templates for a broker type.
 * @param {string} brokerType
 * @returns {Array<object>} templates
 */
export function getTemplates(brokerType) {
  return TEMPLATES[brokerType] || [];
}

/**
 * Get a single template by broker type and template ID.
 * @param {string} brokerType
 * @param {string} templateId
 * @returns {object|null}
 */
export function getTemplate(brokerType, templateId) {
  const templates = TEMPLATES[brokerType];
  if (!templates) return null;
  return templates.find((t) => t.id === templateId) || null;
}

/**
 * Replace {{placeholder}} tokens in a template with actual values.
 * @param {object} template — { subject, body }
 * @param {Record<string, string>} variables
 * @returns {{ subject: string, body: string }}
 */
export function renderTemplate(template, variables = {}) {
  const interpolate = (text) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');

  return {
    subject: interpolate(template.subject),
    body: interpolate(template.body),
  };
}

/**
 * Get all available template categories.
 * @returns {Array<{id: string, label: string}>}
 */
export function getAllCategories() {
  return CATEGORIES;
}
