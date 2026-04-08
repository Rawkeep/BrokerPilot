# Research: Phase 7 — CSV Export/Import + PDF Reports

**Domain:** Data portability and report generation for broker dashboard
**Researched:** 2026-04-08
**Confidence:** HIGH

## Standard Stack

| Need | Library | Version | Rationale |
|------|---------|---------|-----------|
| CSV parsing (import) | `papaparse` | ^5.x | Battle-tested CSV parser, handles encoding edge cases, streaming support, browser + Node |
| CSV generation (export) | `papaparse` | ^5.x | `Papa.unparse()` handles escaping, quoting, custom delimiters |
| PDF generation | `jspdf` | ^3.x | Client-side PDF creation, no server dependency, supports Unicode/German |
| PDF tables | `jspdf-autotable` | ^5.x | Plugin for jsPDF — renders structured data as formatted tables |

## Architecture

### CSV Export (PROD-02)

**Server-side generation** via `GET /api/export/leads?format=csv&brokerType=...`:
- Query leadStore data (client sends leads array in POST body since data is in IndexedDB)
- Actually: Since leads live in client-side IndexedDB, CSV export is **client-side** using PapaParse
- Map lead fields to CSV columns based on broker type (each type has different `leadFields`)
- Handle German number formatting: comma as decimal separator (1.234,56)
- Include standard fields (name, email, phone, company, dealValue, stage, tags, createdAt) + broker-specific custom fields
- Trigger download via `Blob` + `URL.createObjectURL` + click on hidden `<a>`

### CSV Import (PROD-02)

**Client-side parsing** with preview:
1. User selects CSV file
2. PapaParse reads and parses (handles UTF-8, ISO-8859-1 for German umlauts)
3. Preview table shows first 5 rows
4. User maps CSV columns to lead fields (auto-detect by header name match)
5. Validate each row against `validateLead()`
6. Import valid rows to leadStore, show count of skipped/invalid

### PDF Report (PROD-03)

**Client-side generation** using jsPDF + jspdf-autotable:
- Generate from agent results stored in agentStore
- Template per agent type:
  - Lead Qualifier: Score card, factors table, recommended actions list
  - Market Analyst: Market data summary, analysis text, recommendation badge
  - SWOT Strategist: 4-quadrant SWOT matrix table, recommendation text
- German text throughout, proper date formatting (DD.MM.YYYY), Euro currency formatting
- Company branding header: "BrokerPilot — KI-Analyse"
- Disclaimer footer: "Keine Anlageberatung — rein informativ"

## Key Design Decisions

1. **Client-side for both CSV and PDF**: No server round-trip needed since all data lives in browser stores. Keeps the localStorage-first architecture.

2. **PapaParse over manual CSV**: Handles edge cases (quoted fields with commas, newlines in fields, BOM handling for Excel compatibility).

3. **jsPDF over server-side PDF**: No additional server dependency, works offline, faster generation.

4. **Broker-type-aware field mapping**: CSV columns adapt to the active broker type's `leadFields` from `brokerTypes.js`.

## German Formatting Requirements

- Numbers: `1.234,56` (dot for thousands, comma for decimal)
- Dates: `08.04.2026` (DD.MM.YYYY)
- Currency: `1.234,56 EUR` or `EUR 1.234,56`
- CSV delimiter: Semicolon (`;`) — German Excel default, not comma
- CSV encoding: UTF-8 with BOM for Excel compatibility with umlauts

## Pitfalls to Avoid

- **CSV delimiter**: German Excel expects semicolons, not commas. Default to `;`
- **UTF-8 BOM**: Without BOM prefix (`\uFEFF`), Excel mangles umlauts. Always prepend BOM
- **Large imports**: PapaParse can stream, but for simplicity limit import to 1000 rows
- **PDF font**: jsPDF default fonts don't support umlauts. Must add a Unicode-capable font or use built-in Helvetica which handles basic Latin Extended

## Sources

- PapaParse docs: https://www.papaparse.com/docs
- jsPDF docs: https://artskydj.github.io/jsPDF/docs/jsPDF.html
- jspdf-autotable: https://github.com/simonbengtsson/jsPDF-AutoTable
- PITFALLS.md: German number formatting (1.234,56 not 1,234.56)
- Existing: `shared/leadSchema.js`, `shared/brokerTypes.js`, `client/src/stores/agentStore.js`

---
*Research for Phase 7: CSV Export/Import + PDF Reports*
