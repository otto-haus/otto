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
    expect(chatSource).toContain('Letta memory on');
    expect(chatSource).toContain('Letta memory off');
    expect(chatSource).toContain('formatChatSessionSubtitle');
    expect(chatSource).toContain('formatChatDebugTitle');
    expect(chatSource).not.toContain('chatStatusLine');
  });

  it('shows working pulse in the header while a turn is active', () => {
    expect(chatSource).toContain('rt.busy');
    expect(chatSource).toContain('headerSubtitle');
    expect(chatSource).toContain('activityLabel');
  });

  it('drops the fake connected pill when runtime is ready', () => {
    expect(chatSource).not.toMatch(/ready \? 'connected'/);
  });

  it('renders command station on empty connected chat', () => {
    expect(chatSource).toContain('<CommandStationStrip onNavigate={onNavigate} />');
  });
});
