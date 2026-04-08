import { openDB } from 'idb';

const DB_NAME = 'brokerpilot';
const DB_VERSION = 1;

/**
 * Opens (or creates) the BrokerPilot IndexedDB database.
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('leads')) {
        db.createObjectStore('leads', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'provider' });
      }
      if (!db.objectStoreNames.contains('analyses')) {
        db.createObjectStore('analyses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

/**
 * StorageAdapter — async CRUD abstraction over IndexedDB.
 * Every method accepts a storeName and operates on the corresponding object store.
 */
export const storageAdapter = {
  /** @param {string} storeName */
  async getAll(storeName) {
    const db = await getDB();
    return db.getAll(storeName);
  },

  /**
   * @param {string} storeName
   * @param {IDBValidKey} key
   */
  async get(storeName, key) {
    const db = await getDB();
    return db.get(storeName, key);
  },

  /**
   * @param {string} storeName
   * @param {*} value — must include the keyPath field for the target store
   */
  async put(storeName, value) {
    const db = await getDB();
    return db.put(storeName, value);
  },

  /**
   * @param {string} storeName
   * @param {IDBValidKey} key
   */
  async delete(storeName, key) {
    const db = await getDB();
    return db.delete(storeName, key);
  },

  /** @param {string} storeName */
  async clear(storeName) {
    const db = await getDB();
    return db.clear(storeName);
  },
};

/**
 * Creates a Zustand-compatible async storage adapter backed by IndexedDB.
 * Used with Zustand's `persist` middleware for stores that need IndexedDB persistence.
 *
 * @param {string} storeName — the IndexedDB object store to use (e.g. 'settings')
 * @returns {{ getItem: (name: string) => Promise<string|null>, setItem: (name: string, value: string) => Promise<void>, removeItem: (name: string) => Promise<void> }}
 */
export function createIDBStorage(storeName) {
  return {
    async getItem(name) {
      const db = await getDB();
      const val = await db.get(storeName, name);
      return val?.value ?? val ?? null;
    },

    async setItem(name, value) {
      const db = await getDB();
      await db.put(storeName, { key: name, value });
    },

    async removeItem(name) {
      const db = await getDB();
      await db.delete(storeName, name);
    },
  };
}
