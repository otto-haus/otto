import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chatSource = readFileSync(join(import.meta.dir, 'Chat.tsx'), 'utf8');

describe('chat shell craft polish (#081 / #98)', () => {
  it('does not expose dev footer strings in LiveChat source', () => {
    expect(chatSource).not.toMatch(/\bcli:\s/);
    expect(chatSource).not.toContain('MemFS on');
  });

  it('uses human session subtitle without raw ids in the happy path', () => {
    expect(chatSource).toContain('chatCopy.memoryOn');
    expect(chatSource).toContain('chatCopy.memoryOff');
    expect(chatSource).toContain('formatChatSessionSubtitle');
    expect(chatSource).toContain('formatChatDebugTitle');
    expect(chatSource).toContain('lettaMemoryStatusLabel');
    expect(chatSource).not.toContain('chatStatusLine');
  });

  it('links Chat memory subtitle to Settings observatory (#73)', () => {
    expect(chatSource).toContain('openMemoryObservatory');
    expect(chatSource).toContain("sessionStorage.setItem('otto.settings.section', 'memory')");
    expect(chatSource).toContain('chat__memoryLink');
    expect(chatSource).not.toMatch(/memfsEnabled\s*\?\s*chatCopy\.memoryOn/);
  });

  it('bases Chat memory status on live runtime reachability, not MemFS (#73 P2)', () => {
    expect(chatSource).toContain('isCoreMemoryReachable');
    expect(chatSource).toMatch(/!!\s*st\.ready/);
    expect(chatSource).not.toMatch(/memfsEnabled\s*\?\s*chatCopy\.memoryOn/);
    expect(chatSource).not.toMatch(/agentId\?\.trim\(\)\s*\?\s*chatCopy\.memoryOn/);
    expect(chatSource).not.toMatch(/st\.memfsEnabled\s*\?\s*['"]Letta memory on/);
  });

  it('shows working pulse in the header while a turn is active', () => {
    expect(chatSource).toContain('rt.busy');
    expect(chatSource).toContain('headerSubtitle');
    expect(chatSource).toContain('activityLabel');
  });

  it('drops the fake connected pill when runtime is ready', () => {
    expect(chatSource).not.toMatch(/ready \? 'connected'/);
  });

  it('does not render command station strip on empty chat', () => {
    expect(chatSource).not.toContain('CommandStationStrip');
  });
});
