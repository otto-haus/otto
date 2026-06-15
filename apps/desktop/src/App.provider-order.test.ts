import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const appSource = readFileSync(join(import.meta.dir, 'App.tsx'), 'utf8');

describe('App provider bootstrap order', () => {
  test('ToastProvider wraps LabsProvider so Labs persist toasts have context', () => {
    const toastOpen = appSource.indexOf('<ToastProvider>');
    const labsOpen = appSource.indexOf('<LabsProvider>');
    const labsClose = appSource.indexOf('</LabsProvider>');
    const toastClose = appSource.indexOf('</ToastProvider>');

    expect(toastOpen).toBeGreaterThan(-1);
    expect(labsOpen).toBeGreaterThan(toastOpen);
    expect(labsClose).toBeGreaterThan(labsOpen);
    expect(toastClose).toBeGreaterThan(labsClose);
  });
});
