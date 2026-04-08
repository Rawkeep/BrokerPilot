---
phase: 01-foundation-infrastructure
plan: 02
subsystem: persistence-encryption
tags: [indexeddb, crypto, zustand, storage, byok, tdd]
dependency_graph:
  requires: []
  provides: [StorageAdapter, CryptoService, settingsStore, keyStore, useSessionUnlock, useEncryptKey]
  affects: [client/src/services/storage.js, client/src/services/crypto.js, client/src/stores/settingsStore.js, client/src/stores/keyStore.js, client/src/hooks/useCrypto.js]
tech_stack:
  added: [idb@8.0.3, zustand@5.0.12, fake-indexeddb, vitest]
  patterns: [StorageAdapter-abstraction, Zustand-persist-split-storage, Web-Crypto-AES-256-GCM, PBKDF2-key-derivation, TDD-red-green]
key_files:
  created:
    - client/src/services/storage.js
    - client/src/services/crypto.js
    - client/src/stores/settingsStore.js
    - client/src/stores/keyStore.js
    - client/src/hooks/useCrypto.js
    - tests/services/storage.test.js
    - tests/services/crypto.test.js
    - tests/stores/settings.test.js
    - vitest.config.js
  modified:
    - package.json
    - package-lock.json
decisions:
  - Used idb v8.0.3 for IndexedDB promise wrapper (2KB, standard choice)
  - PBKDF2 600K iterations per OWASP 2024 for SHA-256 key derivation
  - Settings store uses localStorage, key store uses IndexedDB via createIDBStorage
  - partialize excludes decryptedKeys from Zustand persistence
metrics:
  duration: 4m 28s
  completed: "2026-04-07T23:30:28Z"
  tasks: 2/2
  tests: 14 passed
---

# Phase 01 Plan 02: Persistence & Encryption Foundation Summary

IndexedDB StorageAdapter via idb, AES-256-GCM CryptoService with PBKDF2 600K iterations, split Zustand stores (localStorage for settings, IndexedDB for encrypted keys), and session unlock hook with beforeunload key clearing.

## Task Results

| Task | Name | Commit | Tests | Key Files |
|------|------|--------|-------|-----------|
| 1 | StorageAdapter with IndexedDB via idb | cfbf7c1 | 7/7 | storage.js, storage.test.js |
| 2 | CryptoService, Zustand stores, session unlock | 1bdae7c | 7/7 | crypto.js, settingsStore.js, keyStore.js, useCrypto.js |

## What Was Built

### StorageAdapter (client/src/services/storage.js)
- Async CRUD abstraction over IndexedDB: getAll, get, put, delete, clear
- IndexedDB schema with 4 object stores: leads (keyPath: id), keys (keyPath: provider), analyses (keyPath: id), settings (keyPath: key)
- createIDBStorage() returns Zustand-compatible async storage adapter for persist middleware
- getDB() exported for direct access when needed

### CryptoService (client/src/services/crypto.js)
- AES-256-GCM encryption with PBKDF2 key derivation from user PIN
- 600,000 PBKDF2 iterations (OWASP 2024 recommendation)
- 128-bit random salt + 96-bit random IV per encryption (unique ciphertext every time)
- Base64 encoding of salt+IV+ciphertext for IndexedDB storage
- Wrong PIN throws error (AES-GCM authenticated encryption)
- Zero external dependencies (Web Crypto API only)

### Settings Store (client/src/stores/settingsStore.js)
- Zustand persist to localStorage key 'bp-settings'
- State: theme (system/light/dark), brokerType (null or broker type), language (de)
- Actions: setTheme, setBrokerType

### Key Store (client/src/stores/keyStore.js)
- Zustand persist to IndexedDB via createIDBStorage('settings')
- encryptedKeys persisted (base64 ciphertext)
- decryptedKeys EXCLUDED from persistence via partialize (D-14)
- Actions: setEncryptedKey, setDecryptedKey, setSessionUnlocked, clearSession

### Session Unlock Hook (client/src/hooks/useCrypto.js)
- useSessionUnlock: single PIN entry decrypts all stored keys
- beforeunload listener clears decrypted keys on tab close (D-13)
- Wrong PIN triggers clearSession + throws 'Falscher PIN'
- useEncryptKey: encrypts and stores a new API key

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **idb v8.0.3** for IndexedDB wrapper -- 2KB, promise-based, handles versioning/upgrades
2. **PBKDF2 600K iterations** -- OWASP 2024 recommendation, ~200ms per derivation on modern hardware
3. **Split storage pattern** -- localStorage for fast sync settings, IndexedDB for larger encrypted key data
4. **partialize for security** -- Only encryptedKeys crosses the memory-to-IndexedDB trust boundary

## Verification

All 14 tests pass:
- 7 StorageAdapter tests (CRUD + Zustand-compatible storage)
- 4 CryptoService tests (encrypt, decrypt, wrong PIN throws, unique ciphertext)
- 3 settingsStore tests (defaults, setTheme, setBrokerType)

## Self-Check: PASSED

All 9 created files verified on disk. Both commit hashes (cfbf7c1, 1bdae7c) found in git log.
