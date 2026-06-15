import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
  buildRuntimeSendPayload,
  findPathLeaksInUserVisibleText,
  findSecretLeaksInUserVisibleText,
  formatAttachmentTrayLabel,
} from '../src/attachment-message';
import { prepareRuntimeSend } from './attachment-delivery';
import { saveAttachment } from './attachments';

const originalConfigDir = process.env.OTTO_CONFIG_DIR;
const originalApiKey = process.env.LETTA_API_KEY;
const originalAgentId = process.env.OTTO_AGENT_ID;

afterEach(() => {
  if (originalConfigDir === undefined) Reflect.deleteProperty(process.env, 'OTTO_CONFIG_DIR');
  else process.env.OTTO_CONFIG_DIR = originalConfigDir;
  if (originalApiKey === undefined) Reflect.deleteProperty(process.env, 'LETTA_API_KEY');
  else process.env.LETTA_API_KEY = originalApiKey;
  if (originalAgentId === undefined) Reflect.deleteProperty(process.env, 'OTTA_AGENT_ID');
  else process.env.OTTA_AGENT_ID = originalAgentId;
});

describe('attachment ingestion smoke (#299)', () => {
  test('persists fixture image and prepares base64 delivery content for the runtime', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-smoke-'));
    process.env.OTTO_CONFIG_DIR = dir;

    const saved = saveAttachment({
      name: 'dogfood-screenshot.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });

    expect(saved.path.startsWith(join(dir, 'attachments'))).toBe(true);
    expect(existsSync(saved.path)).toBe(true);
    expect(readFileSync(saved.path).byteLength).toBeGreaterThan(0);

    const payload = buildRuntimeSendPayload('Inspect this screenshot.', [saved]);
    const prepared = prepareRuntimeSend(payload);
    expect(prepared.storedText).toContain('Inspect this screenshot.');
    expect(prepared.storedText).toContain('dogfood-screenshot.png');
    expect(prepared.storedText).not.toContain(saved.path);
    expect(prepared.deliveryContent[1]?.type).toBe('image');
    if (prepared.deliveryContent[1]?.type === 'image') {
      expect(prepared.deliveryContent[1].source.data).toBe(readFileSync(saved.path).toString('base64'));
    }
  });

  test('keeps local paths out of user-visible attachment tray labels', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-smoke-tray-'));
    process.env.OTTO_CONFIG_DIR = dir;

    const saved = saveAttachment({
      name: 'pasted screenshot.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });

    const trayLabel = formatAttachmentTrayLabel(saved);
    expect(trayLabel).toBe('pasted-screenshot.png');
    expect(findPathLeaksInUserVisibleText(trayLabel, [saved.path, dir])).toEqual([]);
  });

  test('does not leak secrets into user-visible attachment labels', () => {
    process.env.LETTA_API_KEY = 'sk-smoke-test-secret-value-299';
    const trayLabel = formatAttachmentTrayLabel({ name: 'screenshot.png' });
    expect(findSecretLeaksInUserVisibleText(trayLabel)).toEqual([]);
  });
});

const RUN_LIVE = process.env.OTTO_ATTACHMENT_INTEGRATION === '1';

(RUN_LIVE ? describe : describe.skip)('attachment ingestion integration (opt-in)', () => {
  test('requires OTTO_ATTACHMENT_INTEGRATION=1 and LETTA_AGENT_ID — sends disposable smoke turn', async () => {
    if (!process.env.LETTA_AGENT_ID) {
      throw new Error(
        'Broken capability: live attachment integration. Next action: export LETTA_AGENT_ID and rerun with OTTO_ATTACHMENT_INTEGRATION=1.',
      );
    }

    const dir = mkdtempSync(join(tmpdir(), 'otto-attachment-live-'));
    process.env.OTTO_CONFIG_DIR = dir;
    process.env.OTTO_SMOKE = '1';

    const saved = saveAttachment({
      name: 'integration-fixture.png',
      mime: 'image/png',
      dataUrl: ATTACHMENT_SMOKE_FIXTURE_DATA_URL,
    });
    const prepared = prepareRuntimeSend(buildRuntimeSendPayload('Reply exactly: ATTACHMENT_SMOKE_OK', [saved]));
    expect(prepared.deliveryContent[1]?.type).toBe('image');

    const lettaCli =
      process.env.LETTA_CLI_PATH ??
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      'node',
      [
        lettaCli,
        '--agent',
        process.env.LETTA_AGENT_ID!,
        '--new',
        '--no-memfs',
        '--no-skills',
        '--no-system-info-reminder',
        '-p',
        prepared.deliveryContent[0]?.type === 'text' ? prepared.deliveryContent[0].text : 'Reply exactly: ATTACHMENT_SMOKE_OK',
        '--output-format',
        'json',
      ],
      { encoding: 'utf8', env: process.env, timeout: 120_000 },
    );

    if (result.status !== 0) {
      throw new Error(
        `Broken capability: Letta CLI attachment turn. Next action: confirm Letta is running and LETTA_AGENT_ID is valid. stderr: ${result.stderr?.slice(0, 400)}`,
      );
    }

    expect(String(result.stdout)).toContain('ATTACHMENT_SMOKE_OK');
  });
});
