import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { ChannelKind, ChannelListResult, ChannelRecord } from '@otto-haus/core';

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
      return { dir: this.dir, configPath, channels: DEFAULT_CHANNELS, storage: 'default' };
    }

    const raw = parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const channelsRaw = Array.isArray(raw.channels) ? raw.channels : [];
    const channels: ChannelRecord[] = channelsRaw.map((entry) => normalizeChannel(entry as Record<string, unknown>, configPath));

    return { dir: this.dir, configPath, channels, storage: 'files' };
  }
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

function normalizeChannel(raw: Record<string, unknown>, configPath: string): ChannelRecord {
  const kind = raw.kind as ChannelKind;
  return {
    id: String(raw.id ?? 'unknown'),
    kind: kind ?? 'desktop',
    label: String(raw.label ?? raw.id ?? 'Channel'),
    address: String(raw.address ?? ''),
    enabled: raw.enabled !== false,
    requires_approval_to_send: raw.requires_approval_to_send !== false,
    file: configPath,
  };
}
