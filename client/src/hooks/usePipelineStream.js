import { useState, useRef, useCallback } from 'react';
import { useAIStore } from '../stores/aiStore.js';
import { useKeyStore } from '../stores/keyStore.js';

/**
 * usePipelineStream — SSE streaming hook for the multi-agent pipeline.
 *
 * Uses fetch() with POST to /api/agents/pipeline.
 * Reads response.body via ReadableStream + TextDecoder.
 * Tracks progress per step: qualifier, analyst, swot.
 *
 * @returns {{
 *   triggerPipeline: (leadData: object, brokerType: string) => Promise<void>,
 *   isRunning: boolean,
 *   steps: Array<{name: string, status: string, result: object|null, error: string|null}>,
 *   overallResult: object|null,
 * }}
 */
export function usePipelineStream() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([
    { name: 'qualifier', status: 'pending', result: null, error: null },
    { name: 'analyst', status: 'pending', result: null, error: null },
    { name: 'swot', status: 'pending', result: null, error: null },
  ]);
  const [overallResult, setOverallResult] = useState(null);
  const abortRef = useRef(null);

  const selectedProvider = useAIStore((s) => s.selectedProvider);
  const selectedModel = useAIStore((s) => s.selectedModel);
  const decryptedKeys = useKeyStore((s) => s.decryptedKeys);
  const sessionUnlocked = useKeyStore((s) => s.sessionUnlocked);

  const updateStep = useCallback((stepName, updates) => {
    setSteps((prev) =>
      prev.map((s) => (s.name === stepName ? { ...s, ...updates } : s))
    );
  }, []);

  const resetSteps = useCallback(() => {
    setSteps([
      { name: 'qualifier', status: 'pending', result: null, error: null },
      { name: 'analyst', status: 'pending', result: null, error: null },
      { name: 'swot', status: 'pending', result: null, error: null },
    ]);
    setOverallResult(null);
  }, []);

  const triggerPipeline = useCallback(
    async (leadData, brokerType) => {
      if (isRunning) return;

      const apiKey = (sessionUnlocked && decryptedKeys[selectedProvider]) || null;

      setIsRunning(true);
      resetSteps();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/agents/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadData,
            brokerType,
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({ error: 'Pipeline-Anfrage fehlgeschlagen' }));
          throw new Error(errBody.error || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split('\n\n');
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
                  eventData = null;
                }
              }
            }

            if (!eventType || eventData === null) continue;

            switch (eventType) {
              case 'pipeline:start':
                // Pipeline started
                break;

              case 'pipeline:step:start':
                updateStep(eventData.step, { status: 'running' });
                break;

              case 'agent:thinking':
              case 'agent:enriching':
                updateStep(eventData.step, { status: 'running' });
                break;

              case 'pipeline:step:done':
                updateStep(eventData.step, { status: 'done', result: eventData.result });
                break;

              case 'pipeline:step:error':
                updateStep(eventData.step, { status: 'error', error: eventData.error });
                break;

              case 'pipeline:done':
                setOverallResult(eventData);
                break;

              case 'pipeline:error':
                // Fatal pipeline error
                break;

              default:
                break;
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        // Mark any pending steps as error
        setSteps((prev) =>
          prev.map((s) =>
            s.status === 'pending' || s.status === 'running'
              ? { ...s, status: 'error', error: err.message }
              : s
          )
        );
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [
      isRunning,
      selectedProvider,
      selectedModel,
      decryptedKeys,
      sessionUnlocked,
      updateStep,
      resetSteps,
    ]
  );

  return { triggerPipeline, isRunning, steps, overallResult };
}
