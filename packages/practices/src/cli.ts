#!/usr/bin/env bun
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPracticeSpec } from './load.js';
import { validatePracticeSpec } from './validate.js';

interface Row {
  slug: string;
  status: string;
  result: string;
}

function defaultRepoRoot(): string {
  return process.env.OTTO_ROOT ?? process.env.VINNY_OS_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
}

function formatTable(rows: Row[]): string {
  const headers = ['slug', 'status', 'result'] as const;
  const widths = {
    slug: Math.max(headers[0].length, ...rows.map((row) => row.slug.length)),
    status: Math.max(headers[1].length, ...rows.map((row) => row.status.length)),
    result: Math.max(headers[2].length, ...rows.map((row) => row.result.length)),
  };

  const line = `${headers[0].padEnd(widths.slug)}  ${headers[1].padEnd(widths.status)}  ${headers[2].padEnd(widths.result)}`;
  const rule = `${'-'.repeat(widths.slug)}  ${'-'.repeat(widths.status)}  ${'-'.repeat(widths.result)}`;
  const body = rows.map((row) => `${row.slug.padEnd(widths.slug)}  ${row.status.padEnd(widths.status)}  ${row.result}`);

  return [line, rule, ...body].join('\n');
}

export async function runCli(root = defaultRepoRoot()): Promise<number> {
  const practicesDir = join(root, 'practices');
  const entries = await readdir(practicesDir, { withFileTypes: true });
  const practiceDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  const rows: Row[] = [];
  const details: string[] = [];
  let errorCount = 0;

  for (const slug of practiceDirs) {
    const specPath = join(practicesDir, slug, 'practice.yaml');

    try {
      const spec = await loadPracticeSpec(specPath);
      const result = validatePracticeSpec(spec, slug);
      errorCount += result.errors.length;

      rows.push({
        slug,
        status: typeof spec.status === 'string' ? spec.status : 'unknown',
        result: result.errors.length === 0 ? 'ok' : `${result.errors.length} violation${result.errors.length === 1 ? '' : 's'}`,
      });

      if (result.errors.length > 0 || result.warnings.length > 0) {
        details.push(
          [
            `${slug}:`,
            ...result.errors.map((error) => `  error: ${error}`),
            ...result.warnings.map((warning) => `  warning: ${warning}`),
          ].join('\n'),
        );
      }
    } catch (error) {
      errorCount += 1;
      rows.push({ slug, status: 'unknown', result: '1 violation' });
      details.push(`${slug}:\n  error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(formatTable(rows));

  if (details.length > 0) {
    console.log(`\n${details.join('\n\n')}`);
  }

  return errorCount === 0 ? 0 : 1;
}

if (import.meta.main) {
  const exitCode = await runCli(process.argv[2]);
  process.exit(exitCode);
}
