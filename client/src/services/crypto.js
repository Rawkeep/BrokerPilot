/**
 * CryptoService — AES-256-GCM encryption with PBKDF2 key derivation.
 * Uses the Web Crypto API (browser-native, zero external dependencies).
 *
 * Security parameters follow OWASP 2024 recommendations.
 */

const PBKDF2_ITERATIONS = 600000; // OWASP 2024 recommendation for SHA-256
const SALT_LENGTH = 16; // 128-bit salt
const IV_LENGTH = 12;   // 96-bit IV for AES-GCM

/**
 * Derives an AES-256-GCM key from a PIN using PBKDF2.
 * @param {string} pin
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(pin, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext with a PIN using AES-256-GCM.
 * Returns base64-encoded salt + IV + ciphertext for storage.
 *
 * @param {string} plaintext — the value to encrypt (e.g. an API key)
 * @param {string} pin — the user's PIN/password
 * @returns {Promise<string>} base64-encoded encrypted payload
 */
export async function encrypt(plaintext, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Concatenate salt + iv + ciphertext into a single buffer
  const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...result));
}

/**
 * Decrypts a base64-encoded payload with a PIN.
 * Throws on wrong PIN (AES-GCM authentication failure).
 *
 * @param {string} base64Data — the encrypted payload from encrypt()
 * @param {string} pin — the user's PIN/password
 * @returns {Promise<string>} the original plaintext
 * @throws {Error} if PIN is wrong or data is corrupted
 */
export async function decrypt(base64Data, pin) {
  const data = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(pin, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
