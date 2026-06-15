# Task reference

otto ships a [`Taskfile.yml`](../Taskfile.yml) — [go-task](https://taskfile.dev) recipes that
wrap the common build, run, test, and release commands. Install go-task, then run `task` with no
arguments to list everything; this page documents each task. Descriptions are taken verbatim from
the Taskfile. For the underlying `bun` scripts and prerequisites, see [`docs/INSTALL.md`](INSTALL.md).

```sh
task            # list all available tasks
task <name>     # run one, e.g. task dev
```

## Run the desktop app

| Task | What it does |
|---|---|
| `task dev` | Desktop — web preview (Vite, http://localhost:5173) |
| `task electron` | Desktop — Electron app wired to the live Letta runtime |
| `task open` | Open installed /Applications/otto.app without the Electron-as-Node footgun |
| `task quit` | Quit installed otto app |

## Build, package & install

| Task | What it does |
|---|---|
| `task build` | Build the desktop app (main + preload + renderer) |
| `task package` | Package the macOS .app (electron-builder, arm64) |
| `task refresh` | Build + package + install to /Applications/otto.app + open |
| `task staging` | Build + package + install/open isolated /Applications/otto-staging.app |
| `task clean` | Remove build artifacts (out/, dist/, dist-app/) |

## Quality & CI

| Task | What it does |
|---|---|
| `task typecheck` | Typecheck everything (core + practices + desktop renderer + electron) |
| `task test` | Unit tests |
| `task lint` | Lint with Biome (no install — via bunx) |
| `task format` | Format with Biome (writes changes) |
| `task check` | Full local CI gate — mirrors `.github/workflows/ci.yml` |
| `task verify` | v0 release gate (`scripts/verify-v0.mjs`) |
| `task release:gate` | Pre-release gate — lint + checks + tests + electron build + regression guards |

## Smoke tests

| Task | What it does |
|---|---|
| `task smoke:cli` | Direct Letta CLI smoke against the configured local agent in a disposable conversation |
| `task smoke:desktop` | Non-destructive desktop smoke — launches a temporary second instance, leaves live otto.app alone |
| `task smoke:desktop:live` | **DANGEROUS** — quits/reopens the live installed app; use only when nobody is chatting in it |

## Docs site (Mintlify)

| Task | What it does |
|---|---|
| `task docs:dev` | DevEx docs preview (Mintlify) |
| `task docs:validate` | Validate DevEx docs (Mintlify) |
| `task docs:links` | Check DevEx docs links (Mintlify) |

## Utilities

| Task | What it does |
|---|---|
| `task default` | List available tasks (the same as running `task` with no arguments) |
| `task gen` | Regenerate file-backed data (practices.json, readiness.json) |
| `task ps` | Show live otto + spawned Letta CLI processes |

> `task refresh`, `task staging`, and `task smoke:desktop:live` touch your installed
> `/Applications` apps — run them deliberately. The non-destructive `task smoke:desktop` is the
> safe way to smoke-test without disturbing a running otto.
