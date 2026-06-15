#!/usr/bin/env node
/**
 * Generate staging/dev macOS icon from production iconset.
 * Output: apps/desktop/build/icon-staging.icns (+ otto-staging.iconset/)
 *
 * Visual treatment: amber tint + bottom-right corner wedge so staging is
 * unmistakable in Dock, Finder, and app switcher vs canonical production icon.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = resolve(__dirname, '../build');
const SRC_ICONSET = join(BUILD_DIR, 'otto.iconset');
const STAGING_ICONSET = join(BUILD_DIR, 'otto-staging.iconset');
const STAGING_ICNS = join(BUILD_DIR, 'icon-staging.icns');
const PREVIEW_PNG = join(BUILD_DIR, 'icon-staging-preview.png');

const STAGING_AMBER = '#E87722';
const ICON_PNG = /^icon_\d+x\d+(@2x)?\.png$/;

function isSafeIconFilename(name) {
  return ICON_PNG.test(name);
}

function iconPath(iconsetDir, name) {
  if (!isSafeIconFilename(name)) {
    throw new Error(`Refusing unexpected icon filename: ${name}`);
  }
  const root = resolve(iconsetDir);
  const resolved = resolve(iconsetDir, name);
  if (resolved !== root && !resolved.startsWith(`${root}/`)) {
    throw new Error(`Refusing path outside iconset: ${name}`);
  }
  return resolved;
}

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

function tintStagingPng(inputPath, outputPath) {
  run('magick', [
    inputPath,
    '(',
    '+clone',
    '-colorspace',
    'Gray',
    '-fill',
    STAGING_AMBER,
    '-tint',
    '65',
    ')',
    '-compose',
    'Overlay',
    '-composite',
    '(',
    '+clone',
    '-alpha',
    'off',
    '-fill',
    STAGING_AMBER,
    '-draw',
    'polygon 55%,100% 100%,100% 100%,55%',
    ')',
    '-compose',
    'Over',
    '-composite',
    outputPath,
  ]);
}

function main() {
  if (!existsSync(SRC_ICONSET)) {
    console.error(`Missing production iconset: ${SRC_ICONSET}`);
    process.exit(1);
  }

  rmSync(STAGING_ICONSET, { recursive: true, force: true });
  mkdirSync(STAGING_ICONSET, { recursive: true });

  const pngs = readdirSync(SRC_ICONSET).filter(isSafeIconFilename).sort();
  if (!pngs.length) {
    console.error(`No PNGs in ${SRC_ICONSET}`);
    process.exit(1);
  }

  for (const name of pngs) {
    tintStagingPng(iconPath(SRC_ICONSET, name), iconPath(STAGING_ICONSET, name));
  }

  run('iconutil', ['-c', 'icns', STAGING_ICONSET, '-o', STAGING_ICNS]);

  const previewSrc =
    pngs.find((name) => name === 'icon_512x512@2x.png') ??
    pngs.find((name) => name === 'icon_512x512.png') ??
    pngs[pngs.length - 1];
  cpSync(iconPath(STAGING_ICONSET, previewSrc), PREVIEW_PNG);

  writeFileSync(
    join(BUILD_DIR, 'icon-staging.meta.json'),
    `${JSON.stringify(
      {
        generatedBy: 'apps/desktop/scripts/generate-staging-icon.mjs',
        treatment: 'amber tint + bottom-right wedge',
        color: STAGING_AMBER,
        sourceIconset: 'otto.iconset',
        outputs: ['icon-staging.icns', 'otto-staging.iconset', 'icon-staging-preview.png'],
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${STAGING_ICNS}`);
  console.log(`Preview ${PREVIEW_PNG}`);
}

main();
