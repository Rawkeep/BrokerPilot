import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIRequest } from '../../client/src/hooks/useAIRequest.js';
import { useAIStore } from '../../client/src/stores/aiStore.js';
import { useKeyStore } from '../../client/src/stores/keyStore.js';

// Mock the API client
vi.mock('../../client/src/services/aiApi.js', () => ({
  sendAIRequest: vi.fn(),
}));

import { sendAIRequest } from '../../client/src/services/aiApi.js';

describe('useAIRequest', () => {
  beforeEach(() => {
    // Reset stores to defaults
    useAIStore.setState({
      selectedProvider: 'openai',
      selectedModel: 'gpt-4o-mini',
      lastResponse: null,
      isLoading: false,
      error: null,
      freemiumCount: 0,
      conversations: [],
    });
    useKeyStore.setState({
      encryptedKeys: {},
      sessionUnlocked: false,
      decryptedKeys: {},
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends request with correct provider, model, messages, and apiKey from keyStore', async () => {
    const mockResponse = {
      content: 'Hallo!',
      model: 'gpt-4o-mini',
      provider: 'openai',
      usage: { inputTokens: 10, outputTokens: 5 },
    };
    sendAIRequest.mockResolvedValue(mockResponse);

    // Set up a decrypted key
    useKeyStore.setState({
      sessionUnlocked: true,
      decryptedKeys: { openai: 'sk-test-key-123' },
    });

    const { result } = renderHook(() => useAIRequest());

    expect(result.current.hasApiKey).toBe(true);

    await act(async () => {
      await result.current.sendMessage('Hallo Welt');
    });

    expect(sendAIRequest).toHaveBeenCalledWith(
      'openai',
      'gpt-4o-mini',
      [{ role: 'user', content: 'Hallo Welt' }],
      'sk-test-key-123'
    );
  });

  it('sends null apiKey when no key available (freemium mode)', async () => {
    const mockResponse = {
      content: 'Hello!',
      model: 'gpt-4o-mini',
      provider: 'openai',
    };
    sendAIRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIRequest());

    expect(result.current.hasApiKey).toBe(false);

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(sendAIRequest).toHaveBeenCalledWith(
      'openai',
      'gpt-4o-mini',
      [{ role: 'user', content: 'Test message' }],
      null
    );
  });

  it('transitions loading state: false -> true -> false on success', async () => {
    let resolveRequest;
    sendAIRequest.mockImplementation(
      () => new Promise((resolve) => { resolveRequest = resolve; })
    );

    const { result } = renderHook(() => useAIRequest());

    expect(result.current.isLoading).toBe(false);

    let sendPromise;
    act(() => {
      sendPromise = result.current.sendMessage('Test');
    });

    // isLoading should be true while request is in flight
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveRequest({ content: 'Response', model: 'gpt-4o-mini', provider: 'openai' });
      await sendPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets error state on failure', async () => {
    sendAIRequest.mockRejectedValue(new Error('Provider unavailable'));

    const { result } = renderHook(() => useAIRequest());

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    expect(result.current.error).toBe('Provider unavailable');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets lastResponse on success', async () => {
    const mockResponse = {
      content: 'Antwort vom KI',
      model: 'gpt-4o-mini',
      provider: 'openai',
      usage: { inputTokens: 15, outputTokens: 20 },
    };
    sendAIRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIRequest());

    await act(async () => {
      await result.current.sendMessage('Frage');
    });

    expect(result.current.lastResponse).toEqual(mockResponse);
  });

  it('increments freemium count when no apiKey is used', async () => {
    sendAIRequest.mockResolvedValue({
      content: 'Free response',
      model: 'gpt-4o-mini',
      provider: 'openai',
    });

    const { result } = renderHook(() => useAIRequest());

    await act(async () => {
      await result.current.sendMessage('Free question');
    });

    expect(useAIStore.getState().freemiumCount).toBe(1);
  });

  it('does not increment freemium count when apiKey is used', async () => {
    sendAIRequest.mockResolvedValue({
      content: 'BYOK response',
      model: 'gpt-4o-mini',
      provider: 'openai',
    });

    useKeyStore.setState({
      sessionUnlocked: true,
      decryptedKeys: { openai: 'sk-byok-key' },
    });

    const { result } = renderHook(() => useAIRequest());

    await act(async () => {
      await result.current.sendMessage('BYOK question');
    });

    expect(useAIStore.getState().freemiumCount).toBe(0);
  });

  it('adds messages to conversations on send and response', async () => {
    sendAIRequest.mockResolvedValue({
      content: 'AI says hi',
      model: 'gpt-4o-mini',
      provider: 'openai',
    });

    const { result } = renderHook(() => useAIRequest());

    await act(async () => {
      await result.current.sendMessage('User says hi');
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.conversations[0]).toEqual({
      role: 'user',
      content: 'User says hi',
    });
    expect(result.current.conversations[1]).toEqual({
      role: 'assistant',
      content: 'AI says hi',
    });
  });

  it('uses the selected provider from aiStore', async () => {
    sendAIRequest.mockResolvedValue({
      content: 'Claude response',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    });

    useAIStore.setState({
      selectedProvider: 'anthropic',
      selectedModel: 'claude-sonnet-4-20250514',
    });

    useKeyStore.setState({
      sessionUnlocked: true,
      decryptedKeys: { anthropic: 'sk-ant-key' },
    });

    const { result } = renderHook(() => useAIRequest());

    await act(async () => {
      await result.current.sendMessage('Hallo Claude');
    });

    expect(sendAIRequest).toHaveBeenCalledWith(
      'anthropic',
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: 'Hallo Claude' }],
      'sk-ant-key'
    );
  });
});
