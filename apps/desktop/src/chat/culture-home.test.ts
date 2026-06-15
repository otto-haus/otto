import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCultureHome, receiptAuthorityLabel } from './culture-home';
import type { ReceiptSummary } from '../runtime';

const stripSource = readFileSync(join(import.meta.dir, '../components/ui/CommandStationStrip.tsx'), 'utf8');
const chatSource = readFileSync(join(import.meta.dir, '../surfaces/Chat.tsx'), 'utf8');

describe('buildCultureHome', () => {
  test('uses honest empty copy when stores are empty', () => {
    const home = buildCultureHome({
      constitution: {
        dir: '/tmp',
        yamlPath: '/tmp/constitution.yaml',
        mdPath: '/tmp/constitution.md',
        rawYaml: '',
        storage: 'files',
        document: {
          schema: 'otto.constitution.v1',
          version: '0.1',
          values: [],
          forbidden_actions: ['silent canon mutation'],
          approval_rules: [],
          standards_refs: [],
          writeback_policy: {
            mode: 'proposal_only',
            requires_curation_accept: true,
            silent_apply_forbidden: true,
          },
          ratification_requirements: [],
        },
      },
      changelog: {
        dir: '/tmp',
        entries: [],
        window_days: 7,
        empty_message: 'No behavior changes this week.',
      },
      latestReceipt: null,
    });

    expect(home.constitutionHint).toBe('1 forbidden action');
    expect(home.changelogHint).toBe('No behavior changes this week.');
    expect(home.latestProofHint).toBe('No receipts yet');
  });

  test('summarizes latest receipt authority and status', () => {
    const latestReceipt: ReceiptSummary = {
      id: 'rcpt_1',
      timestamp: '2026-06-14T12:00:00.000Z',
      status: 'success',
      action: 'constitution.amend',
      subjectType: 'proposal',
      subjectId: 'prop_1',
      summary: 'Amended constitution',
      blockerCode: null,
      evidenceCount: 0,
      practiceSlug: null,
      routineSlug: null,
      path: '/tmp/receipts/rcpt_1.json',
    };
    const home = buildCultureHome({ latestReceipt });

    expect(home.latestProofHint).toBe('success · human (constitution)');
    expect(receiptAuthorityLabel({
      id: 'rcpt_2',
      timestamp: '2026-06-14T12:00:00.000Z',
      status: 'success',
      subjectType: 'run',
      subjectId: 'run_1',
      action: 'worker.run',
      summary: 'ok',
      blockerCode: null,
      evidenceCount: 0,
      practiceSlug: null,
      routineSlug: null,
      path: '/tmp/receipts/rcpt_2.json',
    })).toBe('run');
  });
});

describe('Command Station culture home wiring', () => {
  test('culture row renders before operations row', () => {
    expect(stripSource).toContain('commandStationCopy.cultureRow');
    expect(stripSource.indexOf('CULTURE_CARDS.map')).toBeLessThan(stripSource.indexOf('OPS_CARDS.map'));
  });

  test('constitution drill-through opens settings culture section', () => {
    expect(stripSource).toContain("settingsSection: 'culture'");
    expect(stripSource).toContain("sessionStorage.setItem('otto.settings.section', drill.settingsSection)");
  });

  test('LiveChat loads cultureHome from live stores', () => {
    expect(chatSource).toContain('buildCultureHome');
    expect(chatSource).toContain('api.constitution.get()');
    expect(chatSource).toContain('api.changelog.list(7)');
    expect(chatSource).toContain('culture={cultureHome}');
  });
});
