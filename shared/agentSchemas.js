/**
 * Agent Output Schemas (Zod v4)
 *
 * Defines validated output schemas for all 3 AI agents,
 * plus the shared AgentRunRequest schema for the SSE endpoint.
 */

import { z } from 'zod';

// --- Lead Qualifier Output Schema (AGT-01) ---

export const LeadQualifierOutputSchema = z.object({
  score: z.number().min(0).max(100),
  kategorie: z.enum(['heiss', 'warm', 'kalt', 'unqualifiziert']),
  zusammenfassung: z.string().min(1),
  begruendung: z.array(
    z.object({
      faktor: z.string().min(1),
      bewertung: z.enum(['positiv', 'neutral', 'negativ']),
      details: z.string().min(1),
    })
  ),
  empfohleneAktionen: z.array(z.string().min(1)),
  naechsterSchritt: z.string().min(1),
});

// --- Market Analyst Output Schema (AGT-02) ---

export const MarketAnalystOutputSchema = z.object({
  symbol: z.string().min(1),
  assetName: z.string().min(1),
  assetType: z.enum(['aktie', 'krypto', 'immobilie']),
  marktdaten: z.object({
    preis: z.number(),
    veraenderung24h: z.number().optional(),
    marktkapitalisierung: z.number().optional(),
    kgv: z.number().optional(),
  }),
  analyse: z.string().min(1),
  empfehlung: z.enum(['kaufen', 'halten', 'verkaufen']),
  konfidenz: z.enum(['hoch', 'mittel', 'niedrig']),
  risiken: z.array(z.string().min(1)),
  chancen: z.array(z.string().min(1)),
});

// --- SWOT Strategist Output Schema (AGT-03) ---

const SwotItemSchema = z.object({
  punkt: z.string().min(1),
  details: z.string().min(1),
});

export const SwotStrategistOutputSchema = z.object({
  titel: z.string().min(1),
  zusammenfassung: z.string().min(1),
  staerken: z.array(SwotItemSchema),
  schwaechen: z.array(SwotItemSchema),
  chancen: z.array(SwotItemSchema),
  risiken: z.array(SwotItemSchema),
  handlungsempfehlung: z.string().min(1),
});

// --- Agent Run Request Schema ---

export const AGENT_TYPES = ['leadQualifier', 'marketAnalyst', 'swotStrategist', 'tradingAgent'];

export const AgentRunRequestSchema = z.object({
  agentType: z.enum(AGENT_TYPES),
  payload: z.record(z.string(), z.unknown()),
  provider: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().optional(),
});

// --- Pipeline Run Request Schema (ORCH-01) ---

export const PipelineRunRequestSchema = z.object({
  leadData: z.record(z.string(), z.unknown()),
  brokerType: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().optional(),
});
