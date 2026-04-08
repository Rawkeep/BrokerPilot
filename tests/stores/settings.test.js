import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../../client/src/stores/settingsStore.js';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSettingsStore.setState({
      theme: 'system',
      brokerType: null,
      language: 'de',
    });
  });

  it('initializes with default values', () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('system');
    expect(state.brokerType).toBeNull();
    expect(state.language).toBe('de');
  });

  it('setTheme updates theme to dark', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('setBrokerType updates brokerType', () => {
    useSettingsStore.getState().setBrokerType('krypto');
    expect(useSettingsStore.getState().brokerType).toBe('krypto');
  });
});
