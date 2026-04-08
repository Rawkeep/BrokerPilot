import { useState, useRef, useCallback } from 'react';
import { useAIStore } from '../stores/aiStore.js';
import { useKeyStore } from '../stores/keyStore.js';
import { useAgentStore } from '../stores/agentStore.js';

/**
 * useAgentStream — SSE streaming hook for AI agent execution.
 *
 * Uses fetch() with POST (not EventSource, which only supports GET).
 * Reads response.body via ReadableStream + TextDecoder.
 * Parses SSE format: "event: type\ndata: json\n\n"
 *
 * @returns {{
 *   triggerAgent: (agentType: string, payload: object, leadId: string) => Promise<void>,
 *   isStreaming: boolean,
 *   currentStep: string|null,
 *   error: string|null,
 * }}
 */
export function useAgentStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const selectedProvider = useAIStore((s) => s.selectedProvider);
  const selectedModel = useAIStore((s) => s.selectedModel);
  const decryptedKeys = useKeyStore((s) => s.decryptedKeys);
  const sessionUnlocked = useKeyStore((s) => s.sessionUnlocked);

  const startRun = useAgentStore((s) => s.startRun);
  const updateRunStatus = useAgentStore((s) => s.updateRunStatus);
  const setRunResult = useAgentStore((s) => s.setRunResult);
  const setRunError = useAgentStore((s) => s.setRunError);
  const completeRun = useAgentStore((s) => s.completeRun);

  const triggerAgent = useCallback(
    async (agentType, payload, leadId) => {
      // Prevent double-trigger (T-05-09)
      if (isStreaming) return;

      const apiKey = (sessionUnlocked && decryptedKeys[selectedProvider]) || null;

      setIsStreaming(true);
      setCurrentStep('starting');
      setError(null);

      // Generate a client-side run ID (server also generates one)
      const clientRunId = `${agentType}-${Date.now()}`;
      startRun(clientRunId, agentType, leadId);

      // AbortController for cleanup on unmount
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType,
            payload,
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({ error: 'Anfrage fehlgeschlagen' }));
          throw new Error(errBody.error || `HTTP ${response.status}`);
        }

        // Parse SSE from ReadableStream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (split by double newline)
          const messages = buffer.split('\n\n');
          // Keep the last incomplete chunk in the buffer
          buffer = messages.pop() || '';

          for (const message of messages) {
            if (!message.trim()) continue;

            let eventType = null;
            let eventData = null;

            for (const line of message.split('\n')) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                try {
                  eventData = JSON.parse(line.slice(6));
                } catch {
                  // Malformed JSON — drop event (T-05-07)
                  eventData = null;
                }
              }
            }

            if (!eventType || eventData === null) continue;

            // Update store and local state based on event type
            switch (eventType) {
              case 'connected':
                // Server sent connection confirmation with runId
                break;

              case 'agent:start':
                setCurrentStep('starting');
                updateRunStatus(clientRunId, 'starting');
                break;

              case 'agent:enriching':
                setCurrentStep('enriching');
                updateRunStatus(clientRunId, 'enriching', eventData.data);
                break;

              case 'agent:thinking':
                setCurrentStep('thinking');
                updateRunStatus(clientRunId, 'thinking');
                break;

              case 'agent:result':
                setCurrentStep('done');
                setRunResult(clientRunId, eventData.output || eventData);
                break;

              case 'agent:error':
                setCurrentStep('error');
                setError(eventData.message || 'Unbekannter Fehler');
                setRunError(clientRunId, eventData.message || 'Unbekannter Fehler');
                break;

              case 'agent:done':
                setCurrentStep('done');
                completeRun(clientRunId, eventData.duration);
                break;

              default:
                // Unknown event type — ignore
                break;
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // Cancelled on unmount — not an error
          return;
        }
        setCurrentStep('error');
        setError(err.message);
        setRunError(clientRunId, err.message);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      isStreaming,
      selectedProvider,
      selectedModel,
      decryptedKeys,
      sessionUnlocked,
      startRun,
      updateRunStatus,
      setRunResult,
      setRunError,
      completeRun,
    ]
  );

  // Cleanup: abort on unmount handled via ref
  // (The component using this hook should call abortRef cleanup if needed)

  return { triggerAgent, isStreaming, currentStep, error };
}
