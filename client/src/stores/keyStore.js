import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../services/storage.js';

/**
 * Key store — persists encrypted API keys to IndexedDB.
 * Decrypted keys are memory-only and NEVER persisted.
 *
 * Storage backend: IndexedDB via createIDBStorage('settings')
 * Persist key: 'bp-keys'
 *
 * CRITICAL: partialize excludes decryptedKeys from persistence (D-14).
 * Only encryptedKeys (base64 ciphertext + salt + IV) are written to IndexedDB.
 */
export const useKeyStore = create(
  persist(
    (set) => ({
      /** @type {Record<string, string>} provider -> base64 encrypted ciphertext */
      encryptedKeys: {},

      /** @type {boolean} true after successful PIN unlock */
      sessionUnlocked: false,

      /** @type {Record<string, string>} provider -> plaintext API key (memory-only) */
      decryptedKeys: {},

      /**
       * Store an encrypted key for a provider.
       * @param {string} provider
       * @param {string} encrypted — base64 ciphertext from CryptoService
       */
      setEncryptedKey: (provider, encrypted) =>
        set((s) => ({ encryptedKeys: { ...s.encryptedKeys, [provider]: encrypted } })),

      /** @param {boolean} unlocked */
      setSessionUnlocked: (unlocked) => set({ sessionUnlocked: unlocked }),

      /**
       * Store a decrypted key in memory (not persisted).
       * @param {string} provider
       * @param {string} key — plaintext API key
       */
      setDecryptedKey: (provider, key) =>
        set((s) => ({ decryptedKeys: { ...s.decryptedKeys, [provider]: key } })),

      /** Clear all decrypted keys from memory and reset session. */
      clearSession: () => set({ sessionUnlocked: false, decryptedKeys: {} }),
    }),
    {
      name: 'bp-keys',
      storage: createIDBStorage('settings'),
      // CRITICAL: Only persist encryptedKeys — decryptedKeys stay in memory only
      partialize: (state) => ({
        encryptedKeys: state.encryptedKeys,
      }),
    }
  )
);
