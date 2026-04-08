import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings store — persists user preferences to localStorage.
 * Storage key: 'bp-settings'
 *
 * State:
 * - theme: 'system' | 'light' | 'dark'
 * - brokerType: null | 'immobilien' | 'krypto' | 'finanz' | 'versicherung' | 'investment'
 * - language: 'de' (DACH market default)
 */
export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'system',
      brokerType: null,
      language: 'de',

      /** @param {'system' | 'light' | 'dark'} theme */
      setTheme: (theme) => set({ theme }),

      /** @param {string|null} type */
      setBrokerType: (type) => set({ brokerType: type }),
    }),
    {
      name: 'bp-settings', // localStorage key
    }
  )
);
