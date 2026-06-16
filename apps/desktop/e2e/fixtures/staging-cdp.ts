import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';

export const RUN_ID =
  process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

export const RECEIPT_DIR =
  process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), '../../docs/receipts/staging');

export const REAL_LETTA_SETTINGS =
  process.env.OTTO_LETTA_SETTINGS_PATH ?? join(homedir(), '.letta', 'settings.json');

export const DEFAULT_STAGING_APP = '/Applications/otto-staging.app';

export const DEFAULT_DIST_APP = join(process.cwd(), 'dist-app/mac-arm64/otto.app');

export function resolveGitHead(): string | null {
  if (process.env.OTTO_GIT_HEAD) return process.env.OTTO_GIT_HEAD;
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function assertSafeAppTemplate(
  template: string,
  opts: { allowStagingApp?: boolean } = {},
): void {
  const isLive =
    template.includes('/Applications/otto.app') && !template.includes('staging');
  if (isLive) {
    throw new Error('Refusing live app — set OTTO_APP_BUNDLE to a disposable bundle');
  }
  if (!opts.allowStagingApp && template.includes('otto-staging.app')) {
    throw new Error('Refusing otto-staging.app — build dist-app or set OTTO_APP_BUNDLE to a disposable bundle');
  }
}

export type PreparedAppBundle = {
  smokeRoot: string;
  appBundle: string;
  appBin: string;
};

export function prepareDisposableAppBundle(template: string, label: string): PreparedAppBundle {
  const smokeRoot = join(tmpdir(), `otto-staging-${label}-${RUN_ID}`);
  const appBundle = join(smokeRoot, 'otto-staging-smoke.app');
  const appBin = join(appBundle, 'Contents/MacOS/otto');

  rmSync(smokeRoot, { recursive: true, force: true });
  mkdirSync(smokeRoot, { recursive: true });
  execFileSync('/usr/bin/ditto', [template, appBundle]);

  const safeRunId = RUN_ID.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  execFileSync('/usr/libexec/PlistBuddy', [
    '-c',
    `Set :CFBundleIdentifier haus.otto.desktop.staging-smoke.${safeRunId}`,
    '-c',
    `Set :CFBundleDisplayName otto staging smoke ${RUN_ID}`,
    '-c',
    'Set :CFBundleName otto',
    join(appBundle, 'Contents/Info.plist'),
  ]);
  execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', appBundle]);

  return { smokeRoot, appBundle, appBin };
}

export function discoverLettaBaseUrl(): string | null {
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], {
      timeout: 3000,
      encoding: 'utf8',
    });
    const line = out.split('\n').find((row) => /letta/i.test(row) && /(?:127\.0\.0\.1|localhost):\d+/i.test(row));
    const match = line?.match(/(?:127\.0\.0\.1|localhost):(\d+)/i);
    return match ? `http://127.0.0.1:${match[1]}` : null;
  } catch {
    return null;
  }
}

export async function waitForCdp(port: number, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`CDP not ready on port ${port}`);
}

export async function firstPage(context: BrowserContext): Promise<Page> {
  for (let i = 0; i < 40; i += 1) {
    const pages = context.pages();
    if (pages.length) return pages[0];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('No CDP page found');
}

export type CdpSessionOptions = {
  appBin: string;
  profileDir: string;
  home: string;
  port: number;
  envExtra?: Record<string, string>;
  viewport?: { width: number; height: number };
  onConsole?: (type: string, text: string) => void;
  exercise: (page: Page) => Promise<void>;
};

export async function runCdpSession(options: CdpSessionOptions): Promise<void> {
  const { appBin, profileDir, home, port, envExtra = {}, viewport, onConsole, exercise } = options;
  mkdirSync(home, { recursive: true });
  mkdirSync(profileDir, { recursive: true });

  const lettaBaseUrl = process.env.LETTA_BASE_URL ?? discoverLettaBaseUrl();
  const app: ChildProcess = spawn(
    appBin,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`],
    {
      env: {
        ...process.env,
        HOME: home,
        OTTO_HOME: join(home, 'otto-home'),
        OTTO_SMOKE: '1',
        OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
        OTTO_SKIP_LETTA_LSOF: '1',
        ...(REAL_LETTA_SETTINGS ? { OTTO_LETTA_SETTINGS_PATH: REAL_LETTA_SETTINGS } : {}),
        ...(lettaBaseUrl ? { LETTA_BASE_URL: lettaBaseUrl } : {}),
        ...envExtra,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let browser;
  try {
    await waitForCdp(port);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const page = await firstPage(browser.contexts()[0]);
    if (viewport) await page.setViewportSize(viewport);
    if (onConsole) {
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          onConsole(msg.type(), msg.text());
        }
      });
    }
    await exercise(page);
  } finally {
    if (browser) await browser.close().catch(() => {});
    app.kill('SIGTERM');
    await new Promise((r) => app.once('exit', r));
  }
}

export function writeProofReceipt(path: string, proof: object): void {
  mkdirSync(RECEIPT_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(proof, null, 2) + '\n');
}

export async function readActiveState(page: Page) {
  return page.evaluate(async () => {
    const list = await window.otto.threads.list();
    const activeId = list.activeThreadId;
    const key = activeId ? `otto.chat.messages.${activeId}.v1` : 'otto.chat.messages.v1';
    const raw = localStorage.getItem(key);
    let parsed: unknown[] = [];
    try {
      parsed = JSON.parse(raw ?? '[]') as unknown[];
    } catch {
      parsed = [];
    }
    const chat = document.querySelector('.chat');
    return {
      activeThreadId: activeId,
      key,
      rawLength: raw?.length ?? 0,
      messageCount: Array.isArray(parsed) ? parsed.length : 0,
      storage: { key, sample: Array.isArray(parsed) ? parsed.slice(0, 3) : [] },
      visibleText: chat?.textContent ?? document.body.innerText,
    };
  });
}
