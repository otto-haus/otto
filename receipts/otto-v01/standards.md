# Receipt — Standards (Otto v0.1)

- **What changed:** `standards/` swept to Otto (registry, canon, precedents, anti-patterns, evaluations).
- **Demo:** `demo/out/otto-v01-standards.mp4`
- **Test command/output:** No automated test. `cat standards/registry.yaml` shows authority stack + `standards_changes_require_human: true`, `auto_apply: false`.
- **Manual verification:** `ls standards/anti-patterns/` (fake-progress, ceremony-without-signal, harsh-candor, vague-approval); `ls standards/precedents/`.
- **Known limitations:** Review-blocking is documented doctrine; no automated enforcement harness in v0.1.
- **Approval status:** ☐ pending Sebastian.
