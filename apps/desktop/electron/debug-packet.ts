import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OttoConfig, RuntimeStatus } from './shared/types';
import { hasSecret } from './secret-store';
import type { DebugEnvelope } from './debug-envelope';

export type OttoDebugPacket = {
  generatedAt: string;
  appPath: string | null;
  bundleId: string | null;
  rendererAssetName: string | null;
  rendererAssetHash: string | null;
  profilePath: string | null;
  ottoHome: string | null;
  connectionMode: string | null;
  runtimeReady: boolean;
  transportKind: string | null;
  activeThreadId: string | null;
  activeLettaConversationId: string | null;
  selectedModel: string | null;
  selectedEffort: string | null;
  lastRuntimeError: string | null;
  credentials: {
    lettaApiKeyPresent: boolean;
  };
};

export type DebugPacketInput = {
  runtimeStatus: RuntimeStatus;
  config: OttoConfig;
  envelope: DebugEnvelope;
};

export function readRendererAssetInfo(rendererDir?: string): { name: string | null; hash: string | null } {
  const candidates = [
    rendererDir ? join(rendererDir, 'index.html') : null,
    join(__dirname, '../renderer/index.html'),
  ].filter(Boolean) as string[];
  for (const indexPath of candidates) {
    try {
      const html = readFileSync(indexPath, 'utf8');
      const assetMatch = html.match(/assets\/([a-zA-Z0-9_.-]+)\.js/);
      if (!assetMatch) continue;
      const name = assetMatch[1];
      const hashMatch = name.match(/-([a-zA-Z0-9]{8,})$/);
      return { name, hash: hashMatch?.[1] ?? null };
    } catch {
      /* try next */
    }
  }
  return { name: null, hash: null };
}

export function lastRuntimeError(status: RuntimeStatus): string | null {
  if (status.ready) return null;
  const reason = status.reason?.trim();
  if (!reason) return status.code ?? null;
  return reason;
}

export function buildDebugPacket(input: DebugPacketInput): OttoDebugPacket {
  const { runtimeStatus: status, config, envelope } = input;
  return {
    generatedAt: new Date().toISOString(),
    appPath: envelope.appPath,
    bundleId: envelope.bundleId,
    rendererAssetName: envelope.rendererAssetName,
    rendererAssetHash: envelope.rendererAssetHash,
    profilePath: envelope.profilePath,
    ottoHome: envelope.ottoHome,
    connectionMode: config.connectionMode ?? null,
    runtimeReady: status.ready,
    transportKind: status.effectiveTransport ?? status.transportMode ?? null,
    activeThreadId: config.activeThreadId ?? null,
    activeLettaConversationId: status.conversationId ?? config.conversationId ?? null,
    selectedModel: status.modelHandle ?? status.model ?? config.modelHandle ?? null,
    selectedEffort: status.effort ?? config.effort ?? null,
    lastRuntimeError: lastRuntimeError(status),
    credentials: {
      lettaApiKeyPresent: hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY?.trim(),
    },
  };
}

export function formatRuntimeStatusText(status: RuntimeStatus, config: OttoConfig): string {
  const lines = [
    `ready: ${status.ready}`,
    `code: ${status.code ?? '—'}`,
    `reason: ${status.reason ?? '—'}`,
    `transport: ${status.effectiveTransport ?? status.transportMode ?? '—'}`,
    `thread: ${config.activeThreadId ?? '—'}`,
    `conversation: ${status.conversationId ?? config.conversationId ?? '—'}`,
    `model: ${status.modelHandle ?? status.model ?? config.modelHandle ?? '—'}`,
    `effort: ${status.effort ?? config.effort ?? '—'}`,
  ];
  return lines.join('\n');
}

export function formatDebugPacketText(packet: OttoDebugPacket): string {
  return JSON.stringify(packet, null, 2);
}
