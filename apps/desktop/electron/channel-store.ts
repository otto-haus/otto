import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { ChannelKind, ChannelListResult, ChannelRecord, ChannelSkip } from '@otto-haus/core';

const CHANNEL_KINDS = new Set<ChannelKind>(['discord', 'imessage', 'slack', 'email', 'desktop', 'cli']);

const DEFAULT_CHANNELS: ChannelRecord[] = [
  {
    id: 'desktop-chat',
    kind: 'desktop',
    label: 'Otto Desktop Chat',
    address: 'local',
    enabled: true,
    requires_approval_to_send: false,
    file: 'builtin',
  },
];

export class ChannelStore {
  constructor(private dir = resolveChannelsDir()) {}

  listResult(): ChannelListResult {
    const configPath = join(this.dir, 'channels.yaml');
    if (!existsSync(configPath)) {
      return { dir: this.dir, configPath, channels: DEFAULT_CHANNELS, skipped: [], storage: 'default' };
    }

    const skipped: ChannelSkip[] = [];
    let raw: unknown;
    try {
      raw = parse(readFileSync(configPath, 'utf8')) as unknown;
    } catch (error) {
      skipped.push({
        index: 0,
        file: configPath,
        reason: `channels.yaml could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
      });
      return { dir: this.dir, configPath, channels: [], skipped, storage: 'files' };
    }

    const channelsRaw = channelRows(raw, configPath, skipped);
    const channels: ChannelRecord[] = channelsRaw.flatMap((entry, index) => {
      const channel = normalizeChannel(entry, configPath, index, skipped);
      return channel ? [channel] : [];
    });

    return { dir: this.dir, configPath, channels, skipped, storage: 'files' };
  }
}

function channelRows(raw: unknown, configPath: string, skipped: ChannelSkip[]): unknown[] {
  if (!isRecord(raw)) {
    skipped.push({ index: 0, reason: 'channels.yaml root must be an object', file: configPath });
    return [];
  }
  if (!Array.isArray(raw.channels)) {
    skipped.push({ index: 0, reason: 'channels must be an array', file: configPath });
    return [];
  }
  return raw.channels;
}

export function resolveChannelsDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.OTTO_CHANNELS_DIR,
    process.env.OTTO_ROOT ? join(process.env.OTTO_ROOT, 'channels') : null,
    resolve(process.cwd(), 'channels'),
    resolve(process.cwd(), '../../channels'),
    resourcesPath ? join(resourcesPath, 'channels') : null,
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'channels.yaml'))) return candidate;
  }

  return candidates[0] ?? resolve(process.cwd(), 'channels');
}

function normalizeChannel(raw: unknown, configPath: string, index: number, skipped: ChannelSkip[]): ChannelRecord | null {
  if (!isRecord(raw)) {
    skipped.push({ index, reason: 'channel entry must be an object', file: configPath });
    return null;
  }
  const id = nonEmptyString(raw.id);
  if (!id) {
    skipped.push({ index, reason: 'channel id is required', file: configPath });
    return null;
  }
  const kind = nonEmptyString(raw.kind);
  if (!isChannelKind(kind)) {
    skipped.push({ index, reason: `unsupported channel kind for ${id}`, file: configPath });
    return null;
  }
  const address = nonEmptyString(raw.address);
  if (!address) {
    skipped.push({ index, reason: `channel address is required for ${id}`, file: configPath });
    return null;
  }
  return {
    id,
    kind,
    label: nonEmptyString(raw.label) ?? id,
    address,
    enabled: raw.enabled === true,
    requires_approval_to_send: raw.requires_approval_to_send !== false,
    file: configPath,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function isChannelKind(value: string | null): value is ChannelKind {
  return !!value && CHANNEL_KINDS.has(value as ChannelKind);
}
