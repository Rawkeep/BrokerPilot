import { GlassButton } from '../ui/GlassButton.jsx';
import {
  generateLeadQualifierPDF,
  generateMarketAnalystPDF,
  generateSWOTPDF,
  generatePipelinePDF,
  downloadPDF,
} from '../../services/pdfReport.js';
import { de } from '../../i18n/de.js';

/**
 * PdfDownloadButton — PDF download for agent results.
 *
 * @param {{ type: 'qualifier'|'analyst'|'swot'|'pipeline', lead: object, result: object }} props
 */
export function PdfDownloadButton({ type, lead, result }) {
  const t = de.export || {};

  function handleDownload() {
    if (!result) return;

    let doc;
    let filename;
    const dateSuffix = new Date().toISOString().slice(0, 10);
    const leadName = lead?.name?.replace(/\s+/g, '-') || 'lead';

    switch (type) {
      case 'qualifier':
        doc = generateLeadQualifierPDF(lead, result);
        filename = `brokerpilot-qualifier-${leadName}-${dateSuffix}.pdf`;
        break;
      case 'analyst':
        doc = generateMarketAnalystPDF(result);
        filename = `brokerpilot-marktanalyse-${dateSuffix}.pdf`;
        break;
      case 'swot':
        doc = generateSWOTPDF(lead, result);
        filename = `brokerpilot-swot-${leadName}-${dateSuffix}.pdf`;
        break;
      case 'pipeline':
        doc = generatePipelinePDF(lead, result);
        filename = `brokerpilot-pipeline-${leadName}-${dateSuffix}.pdf`;
        break;
      default:
        return;
    }

    if (doc) {
      downloadPDF(doc, filename);
    }
  }

  return (
    <GlassButton onClick={handleDownload} className="pdf-download-button" disabled={!result}>
      {t.downloadPdf || 'PDF herunterladen'}
    </GlassButton>
  );
}
