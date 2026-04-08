import jsPDF from 'jspdf';
import 'jspdf-autotable';

/* ── Farben ──────────────────────────────────────────────── */
const DARK = [15, 23, 42];       // #0f172a
const WHITE = [255, 255, 255];
const AMBER = [245, 158, 11];    // #f59e0b
const GRAY_100 = [243, 244, 246];
const GRAY_200 = [229, 231, 235];
const GRAY_700 = [55, 65, 81];
const TEXT = [30, 30, 50];

/* ── Hilfs-Funktionen ────────────────────────────────────── */

function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)} %`;
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function periodLabel(period) {
  const labels = {
    month: 'Diesen Monat',
    last30: 'Letzte 30 Tage',
    quarter: 'Dieses Quartal',
    year: 'Dieses Jahr',
  };
  return labels[period] || period;
}

function periodDateRange(period) {
  const now = new Date();
  const month = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  if (period === 'month') return month;
  if (period === 'last30') return `Letzte 30 Tage (bis ${formatDate(now.toISOString())})`;
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `Q${q} ${now.getFullYear()}`;
  }
  if (period === 'year') return `${now.getFullYear()}`;
  return month;
}

/** Filtert Leads nach Zeitraum */
function filterByPeriod(leads, period) {
  const now = Date.now();
  const ms = {
    month: 30 * 86400000,
    last30: 30 * 86400000,
    quarter: 90 * 86400000,
    year: 365 * 86400000,
  }[period];
  if (!ms) return leads;
  return leads.filter((l) => now - new Date(l.createdAt).getTime() < ms);
}

/* ── Statistik-Berechnung ────────────────────────────────── */

function computeStats(leads, stages) {
  const total = leads.length;
  const pipelineValue = leads.reduce((s, l) => s + (l.dealValue || 0), 0);
  const closedStage = stages?.find((st) => st.id === 'abgeschlossen' || st.id === 'closing');
  const closedLeads = closedStage
    ? leads.filter((l) => l.stage === closedStage.id)
    : [];
  const conversionRate = total > 0 ? closedLeads.length / total : 0;
  const avgDealValue = total > 0 ? pipelineValue / total : 0;
  const hotLeads = leads.filter((l) => (l.score || 0) >= 70).length;
  const now = Date.now();
  const newLeads = leads.filter(
    (l) => now - new Date(l.createdAt).getTime() < 7 * 86400000
  ).length;

  return { total, pipelineValue, conversionRate, avgDealValue, hotLeads, newLeads, closedLeads: closedLeads.length };
}

function computePipelineBreakdown(leads, stages) {
  if (!stages) return [];
  const totalValue = leads.reduce((s, l) => s + (l.dealValue || 0), 0);
  return stages.map((st) => {
    const inStage = leads.filter((l) => l.stage === st.id);
    const value = inStage.reduce((s, l) => s + (l.dealValue || 0), 0);
    return {
      label: st.label,
      count: inStage.length,
      value,
      pct: totalValue > 0 ? value / totalValue : 0,
    };
  });
}

function computeActivitySummary(leads) {
  let total = 0;
  const byType = {};
  const leadActivity = [];

  for (const lead of leads) {
    const acts = lead.activities || [];
    total += acts.length;
    for (const a of acts) {
      byType[a.type] = (byType[a.type] || 0) + 1;
    }
    if (acts.length > 0) {
      leadActivity.push({ name: lead.name || lead.email || lead.id, count: acts.length });
    }
  }
  leadActivity.sort((a, b) => b.count - a.count);
  return { total, byType, topLeads: leadActivity.slice(0, 10) };
}

/* ── PDF-Generierung ─────────────────────────────────────── */

function addPageNumber(doc, pageNum, totalPages) {
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_700);
  doc.text(`Seite ${pageNum} von ${totalPages}`, 105, 287, { align: 'center' });
}

function addHeader(doc, title, y = 20) {
  doc.setFillColor(...DARK);
  doc.rect(0, y, 210, 12, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(title, 14, y + 8);
  return y + 18;
}

/**
 * Erzeugt einen professionellen Performance-Bericht als PDF.
 *
 * @param {Object} opts
 * @param {Array}  opts.leads      - Alle Leads aus dem Store
 * @param {string} opts.brokerType - Aktueller Broker-Typ-Key
 * @param {Array}  opts.stages     - Pipeline-Stages
 * @param {string} opts.period     - 'month' | 'last30' | 'quarter' | 'year'
 * @param {string} opts.teamName   - Name des Teams / Brokers
 * @param {Object} opts.sections   - { kpi, pipeline, topDeals, activities }
 * @returns {Promise<Blob>}
 */
export async function generatePerformanceReport({
  leads,
  brokerType,
  stages,
  period = 'month',
  teamName = 'BrokerPilot',
  sections = { kpi: true, pipeline: true, topDeals: true, activities: true },
}) {
  const filtered = filterByPeriod(leads, period);
  const stats = computeStats(filtered, stages);
  const breakdown = computePipelineBreakdown(filtered, stages);
  const activitySummary = computeActivitySummary(filtered);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Seitenliste fuer Nummerierung
  const pages = [];
  let currentPage = 1;

  /* ── Seite 1: Deckblatt ──────────────────────────────── */
  pages.push(currentPage);

  // Hintergrund
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 297, 'F');

  // Logo-Text
  doc.setFontSize(32);
  doc.setTextColor(...AMBER);
  doc.text('BrokerPilot', 105, 100, { align: 'center' });

  // Titel
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('Performance-Bericht', 105, 125, { align: 'center' });

  // Zeitraum
  doc.setFontSize(14);
  doc.setTextColor(...GRAY_200);
  doc.text(periodDateRange(period), 105, 145, { align: 'center' });

  // Trennlinie
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.5);
  doc.line(60, 155, 150, 155);

  // Team-Name
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text(teamName, 105, 170, { align: 'center' });

  if (brokerType) {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_200);
    doc.text(`Bereich: ${brokerType.charAt(0).toUpperCase() + brokerType.slice(1)}`, 105, 180, { align: 'center' });
  }

  // Erstellungsdatum
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_700);
  doc.text(`Erstellt am ${formatDate(new Date().toISOString())}`, 105, 260, { align: 'center' });

  /* ── Seite 2: KPI-Uebersicht ─────────────────────────── */
  if (sections.kpi) {
    doc.addPage();
    currentPage++;
    pages.push(currentPage);

    let y = addHeader(doc, 'KPI-Uebersicht');

    const kpis = [
      ['Leads gesamt', String(stats.total)],
      ['Pipeline-Wert', formatCurrency(stats.pipelineValue)],
      ['Konversionsrate', formatPercent(stats.conversionRate)],
      ['Durchschn. Deal-Wert', formatCurrency(stats.avgDealValue)],
      ['Hot Leads (Score >= 70)', String(stats.hotLeads)],
      ['Neue Leads (7 Tage)', String(stats.newLeads)],
      ['Abgeschlossene Deals', String(stats.closedLeads)],
    ];

    // KPI-Karten als Tabelle
    doc.autoTable({
      startY: y + 4,
      head: [['Kennzahl', 'Wert']],
      body: kpis,
      theme: 'grid',
      headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: TEXT },
      alternateRowStyles: { fillColor: GRAY_100 },
      columnStyles: {
        0: { cellWidth: 90, fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // Highlight-Box
    const tableEnd = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(...AMBER);
    doc.roundedRect(14, tableEnd, 182, 24, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text('Pipeline-Wert', 24, tableEnd + 10);
    doc.setFontSize(16);
    doc.text(formatCurrency(stats.pipelineValue), 24, tableEnd + 19);
    doc.setFontSize(11);
    doc.text('Konversion', 120, tableEnd + 10);
    doc.setFontSize(16);
    doc.text(formatPercent(stats.conversionRate), 120, tableEnd + 19);
  }

  /* ── Seite 3: Pipeline-Aufschluesselung ──────────────── */
  if (sections.pipeline && breakdown.length > 0) {
    doc.addPage();
    currentPage++;
    pages.push(currentPage);

    let y = addHeader(doc, 'Pipeline-Aufschluesselung');

    // Tabelle
    doc.autoTable({
      startY: y + 4,
      head: [['Phase', 'Anzahl', 'Wert', '% des Gesamtwerts']],
      body: breakdown.map((r) => [r.label, String(r.count), formatCurrency(r.value), formatPercent(r.pct)]),
      theme: 'grid',
      headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: TEXT },
      alternateRowStyles: { fillColor: GRAY_100 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // Einfaches Balkendiagramm
    const chartY = doc.lastAutoTable.finalY + 16;
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('Pipeline-Verteilung nach Wert', 14, chartY);

    const chartTop = chartY + 6;
    const chartHeight = 60;
    const barWidth = 160 / Math.max(breakdown.length, 1);
    const maxVal = Math.max(...breakdown.map((r) => r.value), 1);

    for (let i = 0; i < breakdown.length; i++) {
      const barH = (breakdown[i].value / maxVal) * chartHeight;
      const x = 14 + i * barWidth + 4;

      // Balken
      doc.setFillColor(...AMBER);
      doc.rect(x, chartTop + chartHeight - barH, barWidth - 8, barH, 'F');

      // Label
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_700);
      const labelText = breakdown[i].label.length > 10
        ? breakdown[i].label.substring(0, 9) + '.'
        : breakdown[i].label;
      doc.text(labelText, x + (barWidth - 8) / 2, chartTop + chartHeight + 5, { align: 'center' });

      // Wert ueber Balken
      doc.setFontSize(6);
      doc.setTextColor(...DARK);
      doc.text(formatCurrency(breakdown[i].value), x + (barWidth - 8) / 2, chartTop + chartHeight - barH - 2, { align: 'center' });
    }
  }

  /* ── Seite 4: Top-Deals ──────────────────────────────── */
  if (sections.topDeals) {
    doc.addPage();
    currentPage++;
    pages.push(currentPage);

    let y = addHeader(doc, 'Top-Deals');

    const topLeads = [...filtered]
      .sort((a, b) => (b.dealValue || 0) - (a.dealValue || 0))
      .slice(0, 10);

    if (topLeads.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...GRAY_700);
      doc.text('Keine Deals im ausgewaehlten Zeitraum vorhanden.', 14, y + 10);
    } else {
      doc.autoTable({
        startY: y + 4,
        head: [['Name', 'Unternehmen', 'Wert', 'Phase', 'Score']],
        body: topLeads.map((l) => [
          l.name || '–',
          l.company || '–',
          formatCurrency(l.dealValue),
          l.stage || '–',
          l.score != null ? String(l.score) : '–',
        ]),
        theme: 'grid',
        headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 9, textColor: TEXT },
        alternateRowStyles: { fillColor: GRAY_100 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35 },
          4: { cellWidth: 25, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });
    }
  }

  /* ── Seite 5: Aktivitaeten ───────────────────────────── */
  if (sections.activities) {
    doc.addPage();
    currentPage++;
    pages.push(currentPage);

    let y = addHeader(doc, 'Aktivitaeten-Uebersicht');

    // Gesamt
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(`Aktivitaeten gesamt: ${activitySummary.total}`, 14, y + 8);
    y += 16;

    // Nach Typ
    const typeLabels = {
      note: 'Notizen',
      stage_change: 'Phase-Aenderungen',
      edit: 'Bearbeitungen',
      ai_analysis: 'KI-Analysen',
      email: 'E-Mails',
      call: 'Anrufe',
      create: 'Erstellungen',
    };

    const typeRows = Object.entries(activitySummary.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => [typeLabels[type] || type, String(count)]);

    if (typeRows.length > 0) {
      doc.autoTable({
        startY: y,
        head: [['Aktivitaetstyp', 'Anzahl']],
        body: typeRows,
        theme: 'grid',
        headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: TEXT },
        alternateRowStyles: { fillColor: GRAY_100 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 40, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Aktivste Leads
    if (activitySummary.topLeads.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text('Aktivste Leads', 14, y + 4);

      doc.autoTable({
        startY: y + 8,
        head: [['Lead', 'Aktivitaeten']],
        body: activitySummary.topLeads.map((l) => [l.name, String(l.count)]),
        theme: 'grid',
        headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: TEXT },
        alternateRowStyles: { fillColor: GRAY_100 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });
    }
  }

  /* ── Seitennummern auf allen Seiten ──────────────────── */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageNumber(doc, i, totalPages);
  }

  return doc.output('blob');
}

/**
 * Laedt einen Blob als Datei herunter.
 */
export function downloadReport(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
