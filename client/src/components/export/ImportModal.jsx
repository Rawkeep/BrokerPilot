import { useState, useRef } from 'react';
import { GlassModal } from '../ui/GlassModal.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { parseCSV, mapCSVToLeads, validateImport } from '../../services/csvImport.js';
import { de } from '../../i18n/de.js';

/**
 * ImportModal — CSV import modal with file input, preview, and confirmation.
 *
 * @param {{ open: boolean, onClose: () => void }} props
 */
export function ImportModal({ open, onClose }) {
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const addLead = useLeadStore((s) => s.addLead);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const t = de.import || {};

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const { rows, errors: parseErrors } = parseCSV(content);
      const mapped = mapCSVToLeads(rows, brokerType);
      const { valid, errors } = validateImport(mapped);

      setPreview({
        validLeads: valid,
        errors: [...parseErrors.map((e) => e.message || String(e)), ...errors],
        totalRows: rows.length,
      });
      setImportResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview?.validLeads?.length) return;
    setImporting(true);

    let imported = 0;
    for (const lead of preview.validLeads) {
      await addLead(brokerType, lead);
      imported++;
    }

    setImportResult({ imported });
    setImporting(false);
  }

  function handleClose() {
    setPreview(null);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  }

  return (
    <GlassModal open={open} onClose={handleClose} title={t.title || 'CSV Import'}>
      <div className="import-modal">
        {/* File input */}
        <div className="import-modal__file">
          <label className="import-modal__label">{t.selectFile || 'CSV-Datei auswaehlen'}</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="import-modal__input"
          />
        </div>

        {/* Preview */}
        {preview && !importResult && (
          <div className="import-modal__preview">
            <h4 className="import-modal__preview-title">{t.preview || 'Vorschau'}</h4>
            <div className="import-modal__stats">
              <span className="import-modal__stat import-modal__stat--valid">
                {t.validLeads || 'Gueltige Leads'}: {preview.validLeads.length}
              </span>
              <span className="import-modal__stat">
                {t.totalRows || 'Zeilen gesamt'}: {preview.totalRows}
              </span>
            </div>

            {preview.errors.length > 0 && (
              <div className="import-modal__errors">
                <h5 className="import-modal__errors-title">{t.errors || 'Fehler'}</h5>
                <ul className="import-modal__error-list">
                  {preview.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="import-modal__error-item">{err}</li>
                  ))}
                  {preview.errors.length > 10 && (
                    <li className="import-modal__error-item">
                      ...und {preview.errors.length - 10} weitere
                    </li>
                  )}
                </ul>
              </div>
            )}

            <GlassButton
              variant="primary"
              onClick={handleImport}
              disabled={importing || preview.validLeads.length === 0}
            >
              {importing
                ? (de.common?.loading || 'Laden...')
                : (t.confirm || 'Importieren') + ` (${preview.validLeads.length})`}
            </GlassButton>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className="import-modal__result">
            <p className="import-modal__success">
              {importResult.imported} {t.importedLeads || 'Leads erfolgreich importiert'}
            </p>
            <GlassButton onClick={handleClose}>
              {de.common?.close || 'Schliessen'}
            </GlassButton>
          </div>
        )}
      </div>
    </GlassModal>
  );
}
