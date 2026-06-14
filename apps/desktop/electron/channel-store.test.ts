import { describe, expect, test } from 'bun:test';
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
});
