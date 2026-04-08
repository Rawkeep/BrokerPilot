# Research: Phase 6 — LangGraph Multi-Agent Orchestration

**Domain:** LangGraph.js Supervisor Pipeline for Lead-to-Deal Workflow
**Researched:** 2026-04-08
**Confidence:** HIGH

## Standard Stack

| Need | Library | Version | Rationale |
|------|---------|---------|-----------|
| Graph orchestration | `@langchain/langgraph` | ^0.2.x | StateGraph with supervisor pattern, conditional edges, built-in checkpointing |
| LangChain core | `@langchain/core` | ^0.3.x | Base message types, Annotation API, tool abstractions |
| State annotations | `@langchain/langgraph` (Annotation) | — | Type-safe state schema flowing through all nodes |

## Architecture: Supervisor Pipeline

The pipeline implements a **fixed-sequence supervisor** (not an LLM-routed supervisor). For ORCH-01, the sequence is deterministic: Qualifier -> Analyst -> SWOT. No LLM call is needed for routing — the supervisor follows a predefined order with conditional skips on failure.

```
START -> qualifier -> analyst -> swot -> END
              |            |          |
              v            v          v
         (on fail:    (on fail:   (on fail:
          skip,        skip,       skip,
          mark         mark        mark
          partial)     partial)    partial)
```

### State Shape (Annotation)

```javascript
const PipelineState = Annotation.Root({
  leadData: Annotation(),           // Input lead object
  brokerType: Annotation(),         // Broker type key
  aiConfig: Annotation(),           // { provider, model, apiKey }

  // Agent results (null = not yet run, object = success, Error = failed)
  qualifierResult: Annotation(),
  analystResult: Annotation(),
  swotResult: Annotation(),

  // Pipeline metadata
  completedSteps: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  failedSteps: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  isPartial: Annotation({ reducer: (_, b) => b, default: () => false }),
});
```

### Partial Failure Pattern (ORCH-03)

Each agent node is wrapped in a try/catch. On failure:
1. The error is recorded in `failedSteps`
2. `isPartial` is set to true
3. Execution continues to the next node
4. The final result includes all successful results plus failure markers

This means the pipeline NEVER throws — it always returns a result object with whatever agents succeeded.

### SSE Streaming Pattern (ORCH-02)

The existing `writeSSE` pattern from `server/routes/agents.js` is extended with pipeline-level events:

```
pipeline:start       -> { steps: ['qualifier', 'analyst', 'swot'] }
pipeline:step:start  -> { step: 'qualifier' }
agent:enriching      -> { step: '...' }        (reused from existing)
agent:thinking       -> { step: '...' }        (reused from existing)
pipeline:step:done   -> { step: 'qualifier', result: {...} }
pipeline:step:error  -> { step: 'analyst', error: 'message' }
pipeline:done        -> { results: {...}, isPartial: true/false, failedSteps: [] }
```

## Key Design Decisions

1. **Deterministic routing, not LLM-routed**: Saves one LLM call per step, reduces cost and latency. The lead-to-deal sequence is always the same.

2. **Reuse existing agent modules**: `leadQualifier.js`, `marketAnalyst.js`, `swotStrategist.js` already have `buildPrompt()` and `parseResponse()`. The pipeline nodes wrap these existing functions.

3. **New SSE endpoint, not modifying existing**: `POST /api/agents/pipeline` is separate from `POST /api/agents/run` to avoid breaking the single-agent flow.

4. **Circuit breaker applies per-provider, not per-agent**: If the AI provider is down, all agents fail — no point retrying different agents against the same broken provider.

## Pitfalls to Avoid

- **Do NOT use LLM for routing**: Fixed sequence is cheaper and more predictable
- **Do NOT block on failure**: Each step must try/catch independently
- **Do NOT send apiKey in SSE events**: Security — already enforced in existing code (T-05-03)
- **Do NOT run the pipeline without freemium gate**: Must check usage limits before starting multi-agent run

## Sources

- Existing codebase: `server/agents/agentOrchestrator.js`, `server/routes/agents.js`
- LangGraph.js StateGraph: https://github.com/langchain-ai/langgraphjs
- ARCHITECTURE.md Pattern 1: LangGraph Supervisor
- PITFALLS.md: Agent Infinite Loops and Cost Explosions

---
*Research for Phase 6: LangGraph Multi-Agent Orchestration*
