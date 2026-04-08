import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { storageAdapter, createIDBStorage, getDB } from '../../client/src/services/storage.js';

describe('StorageAdapter', () => {
  beforeEach(async () => {
    try {
      await storageAdapter.clear('leads');
    } catch {
      // Store may not exist yet on first run
    }
  });

  it('put and get a record', async () => {
    await storageAdapter.put('leads', { id: 'abc', name: 'Test' });
    const result = await storageAdapter.get('leads', 'abc');
    expect(result).toEqual({ id: 'abc', name: 'Test' });
  });

  it('getAll returns all records', async () => {
    await storageAdapter.put('leads', { id: 'a1', name: 'Lead 1' });
    await storageAdapter.put('leads', { id: 'a2', name: 'Lead 2' });
    const results = await storageAdapter.getAll('leads');
    expect(results).toHaveLength(2);
  });

  it('delete removes a record', async () => {
    await storageAdapter.put('leads', { id: 'abc', name: 'Test' });
    await storageAdapter.delete('leads', 'abc');
    const result = await storageAdapter.get('leads', 'abc');
    expect(result).toBeUndefined();
  });

  it('clear removes all records', async () => {
    await storageAdapter.put('leads', { id: 'a1', name: 'Lead 1' });
    await storageAdapter.put('leads', { id: 'a2', name: 'Lead 2' });
    await storageAdapter.clear('leads');
    const results = await storageAdapter.getAll('leads');
    expect(results).toEqual([]);
  });
});

describe('createIDBStorage (Zustand-compatible)', () => {
  let storage;

  beforeEach(async () => {
    storage = createIDBStorage('settings');
    try {
      await storage.removeItem('test');
    } catch {
      // May not exist
    }
  });

  it('returns object with getItem, setItem, removeItem methods', () => {
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });

  it('setItem then getItem returns the value', async () => {
    await storage.setItem('test', 'value');
    const result = await storage.getItem('test');
    expect(result).toBe('value');
  });

  it('removeItem then getItem returns null', async () => {
    await storage.setItem('test', 'value');
    await storage.removeItem('test');
    const result = await storage.getItem('test');
    expect(result).toBeNull();
  });
});
