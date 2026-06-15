import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chatSource = readFileSync(join(import.meta.dir, 'Chat.tsx'), 'utf8');
const permissionWindowSource = readFileSync(join(import.meta.dir, 'PermissionWindow.tsx'), 'utf8');
const preloadSource = readFileSync(join(import.meta.dir, '../../electron/preload.ts'), 'utf8');
const ipcSource = readFileSync(join(import.meta.dir, '../../electron/ipc.ts'), 'utf8');
const permissionCardSource = readFileSync(join(import.meta.dir, '../components/ui/PermissionCard.tsx'), 'utf8');

describe('chat permission modal contract (#71 / 045 / #316)', () => {
  it('subscribes to runtime permission requests and opens Permission drawer', () => {
    expect(chatSource).toContain('api.onPermission((req) => {');
    expect(chatSource).toContain('enqueuePermissionRequest(queue, req as PermissionRequestView)');
    expect(chatSource).toContain('headPermissionRequest(permissionQueue)');
    expect(chatSource).toContain("setContextPanel('permission')");
    expect(chatSource).toContain('<ContextDrawer');
    expect(chatSource).toContain("contextPanel === 'permission'");
    expect(chatSource).toContain('<PermissionWindow');
    expect(permissionWindowSource).toContain('<PermissionCard');
  });

  it('maps allow/deny/session decisions to runtime permission.respond', () => {
    expect(chatSource).toContain("decision === 'deny'");
    expect(chatSource).toContain("decision === 'allow-session'");
    expect(chatSource).toContain("api.permission.respond(active.requestId, { behavior: 'deny', message: msg })");
    expect(chatSource).toContain("api.permission.respond(active.requestId, { behavior: 'allow', scope: 'session' })");
    expect(chatSource).toContain("api.permission.respond(active.requestId, { behavior: 'allow', scope: 'once' })");
    expect(chatSource).toContain('dequeuePermissionRequest(queue)');
  });

  it('deny path writes a blocked receipt inline in chat', () => {
    expect(chatSource).toContain('api.permission.denyReceipt');
    expect(chatSource).toContain("action: 'autonomy.permission.deny'");
  });

  it('exposes smoke-only permission trigger for staging modal capture', () => {
    expect(preloadSource).toContain('otto:smoke:trigger-permission');
    expect(preloadSource).toContain('triggerPermission:');
    expect(ipcSource).toContain("'otto:smoke:trigger-permission'");
    expect(ipcSource).toContain("safeWebContentsSend(win, 'otto:permission', req)");
    expect(ipcSource).toContain('OTTO_SMOKE=1');
  });

  it('PermissionCard renders allow once, allow session, and deny actions', () => {
    expect(permissionCardSource).toContain("'allow-once'");
    expect(permissionCardSource).toContain("'allow-session'");
    expect(permissionCardSource).toContain("'deny'");
    expect(permissionCardSource).toContain('permissionCard__tool');
  });
});

describe('chat permission modal thread isolation (#706)', () => {
  it('clears permission and propose modals when activeThreadId changes', () => {
    expect(chatSource).toMatch(/rt\.activeThreadId[\s\S]*setPermissionQueue\(\[\]\)/);
    expect(chatSource).toMatch(/rt\.activeThreadId[\s\S]*setProposeContext\(null\)/);
    expect(chatSource).toContain('setPermissionBusy(false)');
    expect(chatSource).toContain('setProposeBusy(false)');
  });

  it('clears stale permission UI when turn ends while modal is open (abort path)', () => {
    expect(chatSource).toContain('wasBusyRef');
    expect(chatSource).toMatch(/wasBusy && !rt\.busy && permissionQueue\.length > 0/);
  });
});
