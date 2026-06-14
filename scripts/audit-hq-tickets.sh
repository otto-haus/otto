#!/usr/bin/env bash
# Scan planning/hq-tickets and emit 000-audit-status.md (read-only).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HQ="$ROOT/planning/hq-tickets"
OUT="$HQ/000-audit-status.md"
TS="$(date -u +%Y-%m-%dT%H:%MZ)"

python3 - <<'PY' "$HQ" "$OUT" "$TS"
import re, sys
from pathlib import Path

hq, out_path, ts = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
REOPEN_MARKERS = re.compile(
    r"\b(partial|stub|do not move|not met|staging proof pending|deferred)\b", re.I
)
VERDICT_FAIL = re.compile(r"verdict\s*:\s*(fail|partial|blocked|pending)", re.I)
DONE_FAIL = re.compile(r"^\s*[-*]\s.*\b(fail|not met|pending|deferred)\b", re.I | re.M)

folders = ["_Done", "_Parked", "_InReview", "."]


def parse_ticket(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    m_id = re.match(r"^(\d+)", path.name)
    tid = m_id.group(1) if m_id else "?"
    owner = ""
    mo = re.search(r"^Owner:\s*(.+)$", text, re.M)
    if mo:
        owner = mo.group(1).strip()
    depends = ""
    md = re.search(r"^Depends on:\s*(.+)$", text, re.M)
    if md:
        depends = md.group(1).strip()
    reviews = list(re.finditer(r"^## Review\b.*$", text, re.M))
    last_review = ""
    if reviews:
        start = reviews[-1].start()
        nxt = re.search(r"^## (?!Review)", text[start + 1 :], re.M)
        end = start + 1 + nxt.start() if nxt else len(text)
        last_review = text[start:end]
    verdict = ""
    mv = re.search(r"Verdict:\s*(.+)$", last_review, re.M | re.I)
    if mv:
        verdict = mv.group(1).strip()
    reopen = False
    reasons = []
    if last_review and REOPEN_MARKERS.search(last_review):
        reopen = True
        reasons.append("review marker")
    if last_review and VERDICT_FAIL.search(last_review):
        reopen = True
        reasons.append("verdict")
    done = re.search(r"^## Done when\s*$", text, re.M)
    if done:
        tail = text[done.end() :]
        nxt = re.search(r"^## ", tail, re.M)
        block = tail[: nxt.start()] if nxt else tail
        if DONE_FAIL.search(block):
            reopen = True
            reasons.append("done-when fail")
    if "spec only" in text.lower() and "proof" not in text.lower():
        proof_class = "spec_only"
    elif "stub" in last_review.lower() or "stub" in text.lower()[:800]:
        proof_class = "stub"
    elif "unit" in last_review.lower() and "staging" not in last_review.lower():
        proof_class = "unit_only"
    elif verdict.lower().startswith("+1") or "pass" in verdict.lower():
        proof_class = "proven"
    else:
        proof_class = "unknown"
    if path.parent.name == "_Parked":
        proof_class = "blocked"
        reopen = False
        reasons = ["parked"]
    gap = verdict or "(no review block)"
    return {
        "id": tid,
        "file": path.name,
        "folder": path.parent.name if path.parent != hq else "root",
        "owner": owner,
        "depends": depends,
        "proof_class": proof_class,
        "reopen": "yes" if reopen else "no",
        "open_gaps": "; ".join(reasons) if reasons else gap[:120],
    }


rows = []
for folder in folders:
    base = hq if folder == "." else hq / folder
    if not base.is_dir():
        continue
    for path in sorted(base.glob("*.md")):
        if path.name.startswith("000-"):
            continue
        rows.append(parse_ticket(path))

rows.sort(key=lambda r: int(r["id"]) if r["id"].isdigit() else 9999)

lines = [
    "# HQ ticket audit status",
    "",
    f"Generated: {ts} UTC",
    f"Script: `scripts/audit-hq-tickets.sh`",
    "",
    "| id | folder | owner | proof_class | reopen? | open_gaps | file |",
    "|----|--------|-------|-------------|---------|-----------|------|",
]
for r in rows:
    lines.append(
        f"| {r['id']} | {r['folder']} | {r['owner'][:24]} | {r['proof_class']} | {r['reopen']} | {r['open_gaps'][:80]} | {r['file']} |"
    )

reopen_count = sum(1 for r in rows if r["reopen"] == "yes")
lines.extend(
    [
        "",
        f"**Total tickets:** {len(rows)}",
        f"**Reopen candidates:** {reopen_count}",
        "",
        "Human gate: confirm audit output before any `git mv` from `_Done/` to root.",
    ]
)

out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {out_path} ({len(rows)} tickets, {reopen_count} reopen candidates)")
PY
