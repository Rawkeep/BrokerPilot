import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../client/src/services/crypto.js';

describe('CryptoService', () => {
  it('encrypt returns a non-empty base64 string', async () => {
    const result = await encrypt('my-secret-key', '1234');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Verify it is valid base64
    expect(() => atob(result)).not.toThrow();
  });

  it('decrypt with correct PIN returns original plaintext', async () => {
    const encrypted = await encrypt('my-secret-key', '1234');
    const decrypted = await decrypt(encrypted, '1234');
    expect(decrypted).toBe('my-secret-key');
  });

  it('decrypt with wrong PIN throws an error', async () => {
    const encrypted = await encrypt('my-secret-key', '1234');
    await expect(decrypt(encrypted, 'wrong-pin')).rejects.toThrow();
  });

  it('two encryptions of the same plaintext produce different ciphertexts', async () => {
    const enc1 = await encrypt('my-secret-key', '1234');
    const enc2 = await encrypt('my-secret-key', '1234');
    expect(enc1).not.toBe(enc2);
  });
});
