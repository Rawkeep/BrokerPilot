import { useCallback } from 'react';
import { useAIStore } from '../stores/aiStore.js';
import { useKeyStore } from '../stores/keyStore.js';
import { sendAIRequest } from '../services/aiApi.js';

/**
 * useAIRequest — React hook wrapping aiStore for AI request lifecycle.
 *
 * Reads the decrypted BYOK key from keyStore for the current provider.
 * If no key is available (session not unlocked or no key for provider),
 * sends null as apiKey — the backend falls back to freemium mode.
 *
 * @returns {{
 *   sendMessage: (userMessage: string) => Promise<void>,
 *   isLoading: boolean,
 *   error: string|null,
 *   lastResponse: object|null,
 *   conversations: Array<{role: string, content: string}>,
 *   selectedProvider: string,
 *   selectedModel: string,
 *   hasApiKey: boolean,
 * }}
 */
export function useAIRequest() {
  const selectedProvider = useAIStore((s) => s.selectedProvider);
  const selectedModel = useAIStore((s) => s.selectedModel);
  const isLoading = useAIStore((s) => s.isLoading);
  const error = useAIStore((s) => s.error);
  const lastResponse = useAIStore((s) => s.lastResponse);
  const conversations = useAIStore((s) => s.conversations);

  const setIsLoading = useAIStore((s) => s.setIsLoading);
  const setError = useAIStore((s) => s.setError);
  const setLastResponse = useAIStore((s) => s.setLastResponse);
  const addMessage = useAIStore((s) => s.addMessage);
  const incrementFreemiumCount = useAIStore((s) => s.incrementFreemiumCount);

  const decryptedKeys = useKeyStore((s) => s.decryptedKeys);
  const sessionUnlocked = useKeyStore((s) => s.sessionUnlocked);

  const hasApiKey = !!(sessionUnlocked && decryptedKeys[selectedProvider]);

  const sendMessage = useCallback(
    async (userMessage) => {
      const apiKey = (sessionUnlocked && decryptedKeys[selectedProvider]) || null;

      setIsLoading(true);
      setError(null);

      // Add user message to conversation
      addMessage({ role: 'user', content: userMessage });

      const messages = [{ role: 'user', content: userMessage }];

      try {
        const response = await sendAIRequest(
          selectedProvider,
          selectedModel,
          messages,
          apiKey
        );

        setLastResponse(response);
        addMessage({ role: 'assistant', content: response.content });

        if (!apiKey) {
          incrementFreemiumCount();
        }

        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    },
    [
      selectedProvider,
      selectedModel,
      decryptedKeys,
      sessionUnlocked,
      setIsLoading,
      setError,
      setLastResponse,
      addMessage,
      incrementFreemiumCount,
    ]
  );

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    conversations,
    selectedProvider,
    selectedModel,
    hasApiKey,
  };
}
