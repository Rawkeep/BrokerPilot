import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../../config.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useAIStore } from '../../stores/aiStore.js';
import { useKeyStore } from '../../stores/keyStore.js';
import '../../styles/email.css';

/**
 * EmailComposer — Modal panel for composing broker emails with template
 * selection, preview, AI personalization, and sending.
 *
 * @param {{ lead: object, onClose: () => void, onSent?: () => void }} props
 */
export function EmailComposer({ lead, onClose, onSent }) {
  const dialogRef = useRef(null);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const selectedProvider = useAIStore((s) => s.selectedProvider);
  const selectedModel = useAIStore((s) => s.selectedModel);
  const decryptedKeys = useKeyStore((s) => s.decryptedKeys);
  const sessionUnlocked = useKeyStore((s) => s.sessionUnlocked);

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Open dialog when mounted
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Fetch templates for the current broker type
  useEffect(() => {
    if (!brokerType) return;

    fetch(`${API_BASE}/api/email-templates?brokerType=${encodeURIComponent(brokerType)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Vorlagen konnten nicht geladen werden');
        return res.json();
      })
      .then((data) => {
        setTemplates(data.templates || []);
        setCategories(data.categories || []);
      })
      .catch((err) => setError(err.message));
  }, [brokerType]);

  // Build variables from lead data
  const getVariables = useCallback(() => ({
    name: lead?.name || '',
    company: lead?.company || '',
    dealValue: lead?.dealValue ? `${Number(lead.dealValue).toLocaleString('de-DE')} EUR` : '',
    brokerName: lead?.brokerName || 'Ihr Berater',
    nextStep: lead?.nextStep || 'Wir melden uns bei Ihnen',
    portalLink: lead?.portalLink || '#',
  }), [lead]);

  // Render template when selection changes
  useEffect(() => {
    if (!selectedTemplate || !brokerType) return;

    fetch(`${API_BASE}/api/email-templates/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: selectedTemplate,
        brokerType,
        variables: getVariables(),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Vorlage konnte nicht gerendert werden');
        return res.json();
      })
      .then((data) => {
        setSubject(data.subject);
        setBody(data.body);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [selectedTemplate, brokerType, getVariables]);

  // AI personalization
  const handleAiPersonalize = async () => {
    if (!selectedTemplate || !brokerType) return;

    setAiLoading(true);
    setError(null);

    const apiKey = (sessionUnlocked && decryptedKeys[selectedProvider]) || null;

    try {
      const res = await fetch(`${API_BASE}/api/email-templates/ai-personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          brokerType,
          leadData: {
            ...getVariables(),
            notes: lead?.notes || '',
            priority: lead?.priority || '',
          },
          tone: 'professionell und freundlich',
          provider: selectedProvider,
          model: selectedModel,
          apiKey,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'KI-Personalisierung fehlgeschlagen');
      }

      const data = await res.json();
      setSubject(data.subject);
      setBody(data.body);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Send email
  const handleSend = async () => {
    if (!lead?.email || !subject) {
      setError('E-Mail-Adresse und Betreff sind erforderlich.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject,
          html: body,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'E-Mail konnte nicht gesendet werden');
      }

      setSuccess(true);
      onSent?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    onClose();
  };

  // Group templates by category
  const groupedTemplates = categories.map((cat) => ({
    ...cat,
    items: templates.filter((t) => t.category === cat.id),
  }));

  return (
    <dialog
      ref={dialogRef}
      className="email-composer"
      onClick={handleBackdropClick}
      onCancel={handleCancel}
    >
      <div className="email-composer__content">
        {/* Header */}
        <div className="email-composer__header">
          <h2 className="email-composer__title">E-Mail verfassen</h2>
          <span className="email-composer__lead-name">
            {lead?.name || 'Kein Lead'}
            {lead?.email && <span className="email-composer__lead-email"> &lt;{lead.email}&gt;</span>}
          </span>
          <button
            type="button"
            className="email-composer__close"
            onClick={onClose}
            aria-label="Schliessen"
          >
            &times;
          </button>
        </div>

        <div className="email-composer__body">
          {/* Left panel — template selection */}
          <div className="email-composer__sidebar">
            <label className="email-composer__label" htmlFor="ec-template">
              Vorlage waehlen
            </label>
            <select
              id="ec-template"
              className="email-composer__template-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">— Vorlage waehlen —</option>
              {groupedTemplates.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.items.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.subject.replace(/\{\{.*?\}\}/g, '...').slice(0, 50)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* AI Personalize button */}
            <button
              type="button"
              className="email-composer__btn email-composer__btn--ai"
              onClick={handleAiPersonalize}
              disabled={!selectedTemplate || aiLoading}
            >
              {aiLoading ? (
                <span className="email-composer__spinner" />
              ) : (
                <span className="email-composer__ai-icon">&#9733;</span>
              )}
              {aiLoading ? 'Personalisiere...' : 'KI Personalisieren'}
            </button>

            {/* Category legend */}
            <div className="email-composer__categories">
              <span className="email-composer__label">Kategorien</span>
              {categories.map((cat) => (
                <span key={cat.id} className="email-composer__category-badge">
                  {cat.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right panel — preview / edit */}
          <div className="email-composer__preview">
            <div className="email-composer__field">
              <label className="email-composer__label" htmlFor="ec-subject">
                Betreff
              </label>
              <input
                id="ec-subject"
                type="text"
                className="email-composer__input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E-Mail-Betreff..."
              />
            </div>

            <div className="email-composer__field email-composer__field--grow">
              <label className="email-composer__label" htmlFor="ec-body">
                Inhalt
              </label>
              <textarea
                id="ec-body"
                className="email-composer__textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="E-Mail-Inhalt..."
              />
            </div>

            {/* HTML Preview */}
            {body && (
              <details className="email-composer__html-preview">
                <summary className="email-composer__preview-toggle">
                  HTML-Vorschau
                </summary>
                <div
                  className="email-composer__rendered"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </details>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="email-composer__footer">
          {error && <span className="email-composer__error">{error}</span>}
          {success && (
            <span className="email-composer__success">E-Mail erfolgreich gesendet!</span>
          )}

          <div className="email-composer__actions">
            <button
              type="button"
              className="email-composer__btn email-composer__btn--secondary"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="email-composer__btn email-composer__btn--primary"
              onClick={handleSend}
              disabled={sending || !subject || !lead?.email}
            >
              {sending ? 'Sende...' : 'Senden'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
