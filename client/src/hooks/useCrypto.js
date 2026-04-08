import { useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '../services/crypto.js';
import { useKeyStore } from '../stores/keyStore.js';

/**
 * useSessionUnlock — session PIN unlock hook for BYOK key management.
 *
 * Provides unlockSession(pin) which decrypts all stored encrypted keys
 * with a single PIN entry. On tab close, decrypted keys are cleared
 * from memory via beforeunload listener (D-13).
 *
 * @returns {{
 *   sessionUnlocked: boolean,
 *   decryptedKeys: Record<string, string>,
 *   unlockSession: (pin: string) => Promise<void>
 * }}
 */
export function useSessionUnlock() {
  const encryptedKeys = useKeyStore((s) => s.encryptedKeys);
  const sessionUnlocked = useKeyStore((s) => s.sessionUnlocked);
  const decryptedKeys = useKeyStore((s) => s.decryptedKeys);
  const setDecryptedKey = useKeyStore((s) => s.setDecryptedKey);
  const setSessionUnlocked = useKeyStore((s) => s.setSessionUnlocked);
  const clearSession = useKeyStore((s) => s.clearSession);

  // Clear decrypted keys on tab close (D-13)
  useEffect(() => {
    const handleUnload = () => {
      clearSession();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [clearSession]);

  /**
   * Decrypt all stored keys with the given PIN.
   * On any failure, clears session and throws 'Falscher PIN'.
   * @param {string} pin
   */
  const unlockSession = useCallback(async (pin) => {
    try {
      const entries = Object.entries(encryptedKeys);
      for (const [provider, encrypted] of entries) {
        const decrypted = await decrypt(encrypted, pin);
        setDecryptedKey(provider, decrypted);
      }
      setSessionUnlocked(true);
    } catch {
      clearSession();
      throw new Error('Falscher PIN');
    }
  }, [encryptedKeys, setDecryptedKey, setSessionUnlocked, clearSession]);

  return {
    sessionUnlocked,
    decryptedKeys,
    unlockSession,
  };
}

/**
 * useEncryptKey — hook for encrypting and storing a new API key.
 *
 * @returns {{
 *   storeKey: (provider: string, apiKey: string, pin: string) => Promise<void>
 * }}
 */
export function useEncryptKey() {
  const setEncryptedKey = useKeyStore((s) => s.setEncryptedKey);

  /**
   * Encrypt an API key with a PIN and store it.
   * @param {string} provider — e.g. 'openai', 'anthropic'
   * @param {string} apiKey — the plaintext API key
   * @param {string} pin — the user's PIN
   */
  const storeKey = useCallback(async (provider, apiKey, pin) => {
    const encrypted = await encrypt(apiKey, pin);
    setEncryptedKey(provider, encrypted);
  }, [setEncryptedKey]);

  return { storeKey };
}
