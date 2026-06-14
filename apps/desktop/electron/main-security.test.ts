import { describe, expect, test } from 'bun:test';
import { resolveDevRendererUrl } from './main-security';

describe('resolveDevRendererUrl', () => {
  test('allows loopback renderer URLs only in unpackaged dev mode', () => {
    expect(resolveDevRendererUrl('http://127.0.0.1:5173', false)).toBe('http://127.0.0.1:5173/');
    expect(resolveDevRendererUrl('http://localhost:5173/#chat', false)).toBe('http://localhost:5173/#chat');
  });

  test('rejects renderer URLs in packaged mode', () => {
    expect(resolveDevRendererUrl('http://127.0.0.1:5173', true)).toBeNull();
  });

  test('rejects remote and non-http renderer URLs', () => {
    expect(resolveDevRendererUrl('https://example.com/app', false)).toBeNull();
    expect(resolveDevRendererUrl('file:///tmp/index.html', false)).toBeNull();
    expect(resolveDevRendererUrl('javascript:alert(1)', false)).toBeNull();
  });
});
