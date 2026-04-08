import { describe, it, expect } from 'vitest';
import { de } from '../../client/src/i18n/de.js';

describe('German i18n strings (de.js)', () => {
  it('de.nav has keys for all 5 navigation sections', () => {
    const requiredKeys = ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'];
    for (const key of requiredKeys) {
      expect(de.nav).toHaveProperty(key);
      expect(typeof de.nav[key]).toBe('string');
      expect(de.nav[key].length).toBeGreaterThan(0);
    }
  });

  it('de.settings.brokerType has keys for all 5 broker types', () => {
    const requiredTypes = ['immobilien', 'krypto', 'finanz', 'versicherung', 'investment'];
    for (const type of requiredTypes) {
      expect(de.settings.brokerType).toHaveProperty(type);
      expect(typeof de.settings.brokerType[type]).toBe('string');
      expect(de.settings.brokerType[type].length).toBeGreaterThan(0);
    }
  });

  it('de.pages has entries for all 4 content pages', () => {
    const requiredPages = ['dashboard', 'pipeline', 'markt', 'aiAgents'];
    for (const page of requiredPages) {
      expect(de.pages).toHaveProperty(page);
      expect(de.pages[page]).toHaveProperty('title');
      expect(de.pages[page]).toHaveProperty('subtitle');
      expect(de.pages[page]).toHaveProperty('placeholder');
    }
  });

  it('no common English words appear in string values', () => {
    const englishWords = ['Settings', 'Loading', 'Error', 'Save', 'Cancel', 'Delete', 'Edit', 'Close', 'Back', 'Next', 'Search'];

    function collectStrings(obj) {
      const strings = [];
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          strings.push(value);
        } else if (typeof value === 'object' && value !== null) {
          strings.push(...collectStrings(value));
        }
      }
      return strings;
    }

    const allStrings = collectStrings(de);
    for (const str of allStrings) {
      for (const englishWord of englishWords) {
        // Check that the string is not exactly the English word
        // (some German words like "Pipeline" or "Dashboard" are borrowed — skip those)
        const borrowed = ['Dashboard', 'Pipeline'];
        if (borrowed.includes(englishWord)) continue;
        expect(str).not.toBe(englishWord);
      }
    }
  });
});
