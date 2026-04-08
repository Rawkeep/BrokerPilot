import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../client/src/hooks/useTheme';
import { useSettingsStore } from '../../client/src/stores/settingsStore';

/** Helper to mock matchMedia */
function mockMatchMedia(matches = false) {
  const listeners = [];
  const mql = {
    matches,
    addEventListener: vi.fn((_, handler) => listeners.push(handler)),
    removeEventListener: vi.fn((_, handler) => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
  };
  window.matchMedia = vi.fn(() => mql);
  return { mql, listeners };
}

describe('useTheme', () => {
  beforeEach(() => {
    // Reset store to defaults
    useSettingsStore.setState({ theme: 'system', brokerType: null, language: 'de' });
    // Clean up document attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-broker');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets data-theme="light" when theme is light', () => {
    mockMatchMedia(false);
    useSettingsStore.setState({ theme: 'light' });

    renderHook(() => useTheme());

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets data-theme="dark" when theme is dark', () => {
    mockMatchMedia(false);
    useSettingsStore.setState({ theme: 'dark' });

    renderHook(() => useTheme());

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets data-theme="dark" when theme is system and prefers dark', () => {
    mockMatchMedia(true);
    useSettingsStore.setState({ theme: 'system' });

    renderHook(() => useTheme());

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets data-broker attribute when brokerType is set', () => {
    mockMatchMedia(false);
    useSettingsStore.setState({ theme: 'light', brokerType: 'krypto' });

    renderHook(() => useTheme());

    expect(document.documentElement.getAttribute('data-broker')).toBe('krypto');
  });

  it('removes data-broker attribute when brokerType is null', () => {
    mockMatchMedia(false);
    document.documentElement.setAttribute('data-broker', 'finanz');
    useSettingsStore.setState({ theme: 'light', brokerType: null });

    renderHook(() => useTheme());

    expect(document.documentElement.hasAttribute('data-broker')).toBe(false);
  });
});
