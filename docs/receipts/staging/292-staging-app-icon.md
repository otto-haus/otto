# Staging receipt — #292 distinct staging app icon

Issue: https://github.com/otto-haus/otto/issues/292

## Treatment

- **Production** (`/Applications/otto.app`): canonical `build/icon.icns` from owl avatar — unchanged.
- **Staging** (`/Applications/otto-staging.app`): `build/icon-staging.icns` — amber tint + bottom-right wedge applied during `deploy-staging.sh` `stamp_bundle`.

## Asset preview

![production vs staging app icon](./292-staging-app-icon-preview.png)

## Regenerate

```sh
node apps/desktop/scripts/generate-staging-icon.mjs
```

## Verify

```sh
bun test apps/desktop/scripts/staging-icon.test.ts
test -f apps/desktop/build/icon-staging.icns
test -f apps/desktop/build/icon-staging-preview.png
```

## Deploy hook

`apps/desktop/scripts/deploy-staging.sh` copies `icon-staging.icns` over `Contents/Resources/icon.icns` when `APP_CHANNEL=staging` (paths containing `otto-staging`).
