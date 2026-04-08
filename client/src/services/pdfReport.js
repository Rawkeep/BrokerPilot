import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DISCLAIMER = 'Keine Anlageberatung. Alle Informationen dienen ausschliesslich zu Informationszwecken.';
const HEADER_COLOR = [59, 130, 246];

function createDoc() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  return doc;
}

function addHeader(doc, title, subtitle) {
  doc.setFontSize(20);
  doc.setTextColor(...HEADER_COLOR);
  doc.text('BrokerPilot', 14, 20);
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 37);
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);
  return 48;
}

function addFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(DISCLAIMER, 14, 285);
    doc.text(`Seite ${i}/${pageCount}`, 196, 285, { align: 'right' });
  }
}

function addSection(doc, y, title, content) {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setTextColor(...HEADER_COLOR);
  doc.text(title, 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(String(content || '-'), 178);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 4;
  return y;
}

function addList(doc, y, title, items) {
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setTextColor(...HEADER_COLOR);
  doc.text(title, 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  (items || []).forEach((item) => {
    if (y > 275) { doc.addPage(); y = 20; }
    const text = typeof item === 'string' ? item : item.punkt || item.text || JSON.stringify(item);
    const lines = doc.splitTextToSize(`\u2022 ${text}`, 174);
    doc.text(lines, 18, y);
    y += lines.length * 5 + 2;
  });
  return y + 2;
}

export function generateLeadQualifierPDF(lead, result) {
  const doc = createDoc();
  let y = addHeader(doc, 'Lead-Qualifizierung', lead?.name || '');
  const score = result.score ?? result.punkte ?? 0;
  doc.setFontSize(36);
  if (score >= 70) doc.setTextColor(34, 197, 94);
  else if (score >= 30) doc.setTextColor(245, 158, 11);
  else doc.setTextColor(239, 68, 68);
  doc.text(`${score}/100`, 14, y + 10);
  y += 20;
  y = addSection(doc, y, 'Zusammenfassung', result.zusammenfassung);
  y = addSection(doc, y, 'Begruendung', result.begruendung);
  y = addList(doc, y, 'Empfohlene Aktionen', result.empfohleneAktionen || result.empfehlungen || []);
  y = addList(doc, y, 'Risikofaktoren', result.risikoFaktoren || []);
  addFooter(doc);
  return doc;
}

export function generateMarketAnalystPDF(result) {
  const doc = createDoc();
  let y = addHeader(doc, 'Marktanalyse', result.asset || result.symbol || '');
  const emp = result.empfehlung || '';
  doc.setFontSize(16);
  if (emp === 'kaufen') doc.setTextColor(34, 197, 94);
  else if (emp === 'halten') doc.setTextColor(245, 158, 11);
  else doc.setTextColor(239, 68, 68);
  doc.text(`Empfehlung: ${emp.charAt(0).toUpperCase() + emp.slice(1)}`, 14, y);
  y += 10;
  y = addSection(doc, y, 'Zusammenfassung', result.zusammenfassung);
  y = addSection(doc, y, 'Analyse', result.analyse);
  y = addList(doc, y, 'Datenquellen', result.datenquellen || []);
  addFooter(doc);
  return doc;
}

export function generateSWOTPDF(lead, result) {
  const doc = createDoc();
  let y = addHeader(doc, 'SWOT-Analyse', lead?.name || '');
  const maxLen = Math.max(
    (result.staerken || []).length, (result.schwaechen || []).length,
    (result.chancen || []).length, (result.risiken || []).length
  );
  const tableData = [];
  for (let i = 0; i < maxLen; i++) {
    const fmt = (arr) => { const v = arr?.[i]; return typeof v === 'string' ? v : v?.punkt || ''; };
    tableData.push([fmt(result.staerken), fmt(result.schwaechen), fmt(result.chancen), fmt(result.risiken)]);
  }
  autoTable(doc, {
    startY: y,
    head: [['Staerken', 'Schwaechen', 'Chancen', 'Risiken']],
    body: tableData.length > 0 ? tableData : [['—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: HEADER_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc.lastAutoTable?.finalY ?? y + 30) + 8;
  y = addSection(doc, y, 'Zusammenfassung', result.zusammenfassung);
  y = addSection(doc, y, 'Handlungsempfehlung', result.handlungsempfehlung || result.strategischeEmpfehlung);
  addFooter(doc);
  return doc;
}

export function generatePipelinePDF(lead, allResults) {
  const doc = createDoc();
  let y = addHeader(doc, 'Pipeline-Bericht', lead?.name || '');
  if (allResults.leadQualifier) {
    const r = allResults.leadQualifier;
    y = addSection(doc, y, `Lead-Qualifizierung: ${r.score ?? r.punkte ?? '?'}/100`, r.zusammenfassung);
  }
  if (allResults.marketAnalyst) {
    const r = allResults.marketAnalyst;
    y = addSection(doc, y, `Marktanalyse: ${(r.empfehlung || '?')}`, r.zusammenfassung);
  }
  if (allResults.swotStrategist) {
    const r = allResults.swotStrategist;
    y = addSection(doc, y, 'SWOT-Analyse', r.zusammenfassung);
  }
  addFooter(doc);
  return doc;
}

export function downloadPDF(doc, filename) {
  doc.save(filename || `brokerpilot-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
