# Receipt: #281 workspace & permission route settings

**Issue:** https://github.com/otto-haus/otto/issues/281

## Before

- Top bar showed static "otto workspace" label with no resolved path.
- Readiness listed "Workspace root" without editable or reveal controls.
- Session tool allowlist existed only via Chat permission modal; no Settings visibility.

## After

Settings → General adds **Workspace & permissions**:

- **Active folder** — runtime `OTTO_ROOT` or `process.cwd()`, with Reveal in Finder and Copy path.
- **otto home** — `OTTO_HOME` / default `~/.otto`.
- **Permission route** — lists `permissionSessionStore` allowlist; Clear resets session allowances.

## Verify

```sh
bun test apps/desktop/electron/workspace-root.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

## Notes

- Additive; no change to runtime permission modal or store semantics.
- Folder picker deferred (needs restart / store re-resolve).
