import { describe, expect, test } from 'bun:test';
import {
  buildDebugPacket,
  formatRuntimeStatusText,
  lastRuntimeError,
  type DebugPacketInput,
} from './debug-packet';

const envelope = {
  appPath: '/Applications/otto-staging.app/Contents/MacOS/otto',
  bundleId: 'com.otto.desktop.staging',
  profilePath: '/Users/test/Library/Application Support/otto-staging',
  ottoHome: '/Users/test/.otto-staging',
  rendererAssetName: 'index-abc12345',
  rendererAssetHash: 'abc12345',
};

describe('debug-packet', () => {
  test('buildDebugPacket includes required fields without secret values', () => {
    const input: DebugPacketInput = {
      runtimeStatus: {
        ready: false,
        reason: 'Letta unreachable',
        code: 'unreachable',
        conversationId: 'conv-smoke-175',
        modelHandle: 'openai/gpt-5.5',
        effort: 'high',
        effectiveTransport: 'websocket local',
        transportMode: 'auto',
        cliPath: 'letta',
        cliResolved: true,
      },
      config: {
        activeThreadId: 'thread-175',
        connectionMode: 'existing',
        conversationId: 'conv-config',
        modelHandle: 'letta/auto',
        effort: 'medium',
      },
      envelope,
    };
    const packet = buildDebugPacket(input);
    expect(packet.runtimeReady).toBe(false);
    expect(packet.activeThreadId).toBe('thread-175');
    expect(packet.activeLettaConversationId).toBe('conv-smoke-175');
    expect(packet.connectionMode).toBe('existing');
    expect(packet.transportKind).toBe('websocket local');
    expect(packet.selectedModel).toBe('openai/gpt-5.5');
    expect(packet.selectedEffort).toBe('high');
    expect(packet.lastRuntimeError).toBe('Letta unreachable');
    expect(packet.appPath).toBe(envelope.appPath);
    expect(packet.bundleId).toBe(envelope.bundleId);
    expect(packet.rendererAssetHash).toBe('abc12345');
    expect(packet.ottoHome).toBe(envelope.ottoHome);
    expect(packet.credentials).toEqual({ lettaApiKeyPresent: expect.any(Boolean) });
    expect(JSON.stringify(packet)).not.toContain('sk-');
    expect(JSON.stringify(packet)).not.toContain('LETTA_API_KEY=');
  });

  test('formatRuntimeStatusText is concise multi-line status', () => {
    const text = formatRuntimeStatusText(
      {
        ready: false,
        code: 'error',
        reason: 'boom',
        cliPath: 'letta',
        cliResolved: false,
      },
      { activeThreadId: 't1' },
    );
    expect(text).toContain('ready: false');
    expect(text).toContain('thread: t1');
    expect(text).toContain('reason: boom');
  });

  test('lastRuntimeError prefers reason over code', () => {
    expect(lastRuntimeError({ ready: true, cliPath: 'letta', cliResolved: true })).toBeNull();
    expect(
      lastRuntimeError({
        ready: false,
        reason: 'transport failed',
        code: 'error',
        cliPath: 'letta',
        cliResolved: false,
      }),
    ).toBe('transport failed');
  });
});
