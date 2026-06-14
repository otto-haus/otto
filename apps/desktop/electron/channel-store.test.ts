import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChannelStore } from './channel-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const channelsDir = join(repoRoot, 'channels');

describe('ChannelStore', () => {
  test('loads channels.yaml with discord and desktop entries', () => {
    const store = new ChannelStore(channelsDir);
    const result = store.listResult();

    expect(result.storage).toBe('files');
    expect(result.channels.some((channel) => channel.kind === 'discord')).toBe(true);
    expect(result.channels.some((channel) => channel.kind === 'desktop')).toBe(true);
    const discord = result.channels.find((channel) => channel.id === 'discord-main');
    expect(discord?.requires_approval_to_send).toBe(true);
  });

  test('returns built-in desktop channel when channels.yaml is missing', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-channels-'));
    try {
      const result = new ChannelStore(tmp).listResult();

      expect(result.storage).toBe('default');
      expect(result.skipped).toEqual([]);
      expect(result.channels).toHaveLength(1);
      expect(result.channels[0]?.id).toBe('desktop-chat');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('skips malformed channel rows without crashing or fabricating unknown channels', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-channels-'));
    try {
      writeFileSync(
        join(tmp, 'channels.yaml'),
        `channels:
  - null
  - id: missing-kind
    address: local
  - id: unsupported
    kind: pager
    address: pager-main
  - id: missing-address
    kind: discord
  - id: desktop-chat
    kind: desktop
    label: Desktop Chat
    address: local
    enabled: true
    requires_approval_to_send: false
`,
      );

      const result = new ChannelStore(tmp).listResult();

      expect(result.storage).toBe('files');
      expect(result.channels.map((channel) => channel.id)).toEqual(['desktop-chat']);
      expect(result.skipped.map((skip) => skip.index)).toEqual([0, 1, 2, 3]);
      expect(result.channels.some((channel) => channel.id === 'unknown')).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
