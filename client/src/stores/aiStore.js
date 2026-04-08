import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Default model per provider — used when switching providers.
 */
export const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o-mini',
  google: 'gemini-2.0-flash',
  mistral: 'mistral-small-latest',
  groq: 'llama-3.1-8b-instant',
  openrouter: 'meta-llama/llama-3.1-8b-instruct:free',
};

/**
 * AI Store — persists provider/model selection to localStorage.
 * Transient UI state (loading, error, response, freemium count)
 * is NOT persisted.
 *
 * Storage key: 'bp-ai-settings'
 */
export const useAIStore = create(
  persist(
    (set) => ({
      /** @type {string} Selected AI provider key */
      selectedProvider: 'openai',

      /** @type {string} Selected model ID */
      selectedModel: 'gpt-4o-mini',

      /** @type {object|null} Last AI response (transient) */
      lastResponse: null,

      /** @type {boolean} Request in flight (transient) */
      isLoading: false,

      /** @type {string|null} Last error message (transient) */
      error: null,

      /** @type {number} Freemium requests used this session (transient) */
      freemiumCount: 0,

      /** @type {Array<{role: string, content: string}>} Conversation messages (transient) */
      conversations: [],

      /**
       * Set provider and auto-update model to default for that provider.
       * @param {string} provider
       */
      setSelectedProvider: (provider) =>
        set({
          selectedProvider: provider,
          selectedModel: DEFAULT_MODELS[provider] || '',
        }),

      /** @param {string} model */
      setSelectedModel: (model) => set({ selectedModel: model }),

      /** @param {object|null} response */
      setLastResponse: (response) => set({ lastResponse: response }),

      /** @param {boolean} loading */
      setIsLoading: (loading) => set({ isLoading: loading }),

      /** @param {string|null} err */
      setError: (err) => set({ error: err }),

      /** Increment freemium usage counter */
      incrementFreemiumCount: () =>
        set((s) => ({ freemiumCount: s.freemiumCount + 1 })),

      /**
       * Add a message to the conversation history.
       * @param {{role: string, content: string}} message
       */
      addMessage: (message) =>
        set((s) => ({ conversations: [...s.conversations, message] })),

      /** Clear conversation history and last response */
      clearConversation: () =>
        set({ conversations: [], lastResponse: null, error: null }),
    }),
    {
      name: 'bp-ai-settings',
      // Only persist provider and model selection — not transient UI state
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
