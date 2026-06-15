#!/usr/bin/env bun
/**
 * Issue #297 — GitHub issue/project workflow smoke.
 *
 * Default (dry-run, no GitHub mutation):
 *   bun scripts/github-issue-workflow-smoke.ts
 *   task smoke:github-issue-workflow
 *
 * Opt-in live mutation (creates + closes a disposable issue):
 *   OTTO_GITHUB_ISSUE_SMOKE_LIVE=1 bun scripts/github-issue-workflow-smoke.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildDisposableIssuePacket,
  formatWorkflowFailures,
  validateGitHubIssueWorkflowPacket,
} from '../packages/core/src/github-issue-workflow.ts';

const repo = 'otto-haus/otto';
const live = process.env.OTTO_GITHUB_ISSUE_SMOKE_LIVE === '1';
const runId = process.env.OTTO_GITHUB_ISSUE_SMOKE_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const receiptDir = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const receiptPath = join(receiptDir, `297-github-issue-workflow-${runId}.json`);

function fail(capability, message, nextAction) {
  const proof = {
    ok: false,
    mode: live ? 'live' : 'dry-run',
    capability,
    message,
    nextAction,
    runId,
  };
  mkdirSync(receiptDir, { recursive: true });
  writeFileSync(receiptPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
  console.error(`FAIL [${capability}] ${message}`);
  console.error(`Next: ${nextAction}`);
  console.error(`Receipt: ${receiptPath}`);
  process.exit(1);
}

function gh(args) {
  const result = spawnSync('gh', args, { encoding: 'utf8' });
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    status: result.status ?? 1,
  };
}

function main() {
  const packet = buildDisposableIssuePacket(runId);
  const validation = validateGitHubIssueWorkflowPacket(packet);
  if (!validation.ok) {
    fail(
      'local packet validation',
      formatWorkflowFailures(validation.failures),
      'Fix the disposable workflow packet or update github-issue-workflow validation.',
    );
  }

  if (!live) {
    const proof = {
      ok: true,
      mode: 'dry-run',
      runId,
      packet,
      receiptPath,
      message: 'Validated disposable GitHub issue workflow packet without live mutation.',
    };
    mkdirSync(receiptDir, { recursive: true });
    writeFileSync(receiptPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
    console.log('PASS dry-run github issue workflow smoke');
    console.log(`Receipt: ${receiptPath}`);
    return;
  }

  const auth = gh(['auth', 'status', '--hostname', 'github.com']);
  if (!auth.ok) {
    fail(
      'gh authentication',
      auth.stderr || 'gh is not authenticated.',
      'Run `gh auth login` with access to otto-haus/otto, then rerun with OTTO_GITHUB_ISSUE_SMOKE_LIVE=1.',
    );
  }

  const bodyFile = join(receiptDir, `297-github-issue-workflow-body-${runId}.md`);
  mkdirSync(receiptDir, { recursive: true });
  writeFileSync(bodyFile, `${packet.body}\n`, 'utf8');

  const createArgs = [
    'issue',
    'create',
    '--repo',
    repo,
    '--title',
    packet.title,
    '--body-file',
    bodyFile,
    ...packet.labels.flatMap((label) => ['--label', label]),
  ];
  const created = gh(createArgs);
  if (!created.ok) {
    fail(
      'github issue create',
      created.stderr || 'gh issue create failed.',
      'Confirm repo permissions and required labels exist, then rerun the live smoke.',
    );
  }

  const issueUrl = created.stdout;
  const issueNumber = issueUrl.match(/\/issues\/(\d+)/)?.[1];
  if (!issueNumber) {
    fail(
      'github issue create',
      `Could not parse issue number from "${issueUrl}".`,
      'Inspect gh output manually and update the smoke script parser if needed.',
    );
  }

  const viewed = gh(['issue', 'view', issueNumber, '--repo', repo, '--json', 'number,title,labels,state']);
  if (!viewed.ok) {
    gh(['issue', 'close', issueNumber, '--repo', repo, '--comment', 'Smoke cleanup after failed verification.']);
    fail(
      'github issue view',
      viewed.stderr || 'gh issue view failed.',
      'Verify issue visibility and gh scopes, then rerun the live smoke.',
    );
  }

  let issue;
  try {
    issue = JSON.parse(viewed.stdout);
  } catch {
    gh(['issue', 'close', issueNumber, '--repo', repo, '--comment', 'Smoke cleanup after parse failure.']);
    fail(
      'github issue view',
      'Could not parse gh issue view JSON.',
      'Inspect gh issue view output and update the smoke script.',
    );
  }

  const labels = (issue.labels ?? []).map((item) => String(item.name ?? item).toLowerCase());
  const priorityLabels = labels.filter((label) => ['p0', 'p1', 'p2', 'p3'].includes(label));
  if (priorityLabels.length !== 1) {
    gh(['issue', 'close', issueNumber, '--repo', repo, '--comment', 'Smoke cleanup after label validation failure.']);
    fail(
      'priority label',
      `Live issue #${issueNumber} has ${priorityLabels.length} p-labels (${priorityLabels.join(', ') || 'none'}).`,
      'Ensure gh issue create applies exactly one p-label and required labels exist in the repo.',
    );
  }

  const closed = gh([
    'issue',
    'close',
    issueNumber,
    '--repo',
    repo,
    '--comment',
    'Disposable smoke cleanup for issue workflow validation (#297).',
  ]);
  if (!closed.ok) {
    fail(
      'github issue cleanup',
      closed.stderr || 'gh issue close failed.',
      `Manually close disposable issue #${issueNumber} and investigate gh permissions.`,
    );
  }

  const proof = {
    ok: true,
    mode: 'live',
    runId,
    issueNumber: Number(issueNumber),
    issueUrl,
    labels,
    receiptPath,
    message: 'Created, validated, and closed a disposable GitHub issue.',
  };
  writeFileSync(receiptPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
  console.log(`PASS live github issue workflow smoke (#${issueNumber})`);
  console.log(`Receipt: ${receiptPath}`);
}

main();
