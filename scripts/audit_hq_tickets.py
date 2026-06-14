#!/usr/bin/env python3
"""Audit planning/hq-tickets and emit 000-audit-status.md. Optional --apply-reopen."""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HQ = ROOT / "planning" / "hq-tickets"
OUT = HQ / "000-audit-status.md"

SPEC_ONLY_IDS = {40, 79, 82, 91, 92, 116, 129}
CULTURE_KEEP_IDS = {131, 133}  # unit-backed culture CI core; re-audit 132/134/135 separately
FOUNDATION_MAX = 18
CRAFT_RANGE = range(26, 33)
BUG_WAVE = range(33, 39)

REVIEW_HEADING = re.compile(r"^## Review(?: rev\d+)?\s*$", re.MULTILINE)
TICKET_ID = re.compile(r"^(\d+)-")


def git_info() -> tuple[str, str]:
    try:
        branch = subprocess.check_output(
            ["git", "-C", str(ROOT), "rev-parse", "--abbrev-ref", "HEAD"],
            text=True,
        ).strip()
        sha = subprocess.check_output(
            ["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"],
            text=True,
        ).strip()
        return branch, sha
    except subprocess.CalledProcessError:
        return "unknown", "unknown"


def ticket_id(path: Path) -> int | None:
    m = TICKET_ID.match(path.name)
    return int(m.group(1)) if m else None


def parse_meta(text: str) -> dict[str, str]:
    meta: dict[str, str] = {}
    for line in text.splitlines()[:20]:
        if line.startswith("Owner:"):
            meta["owner"] = line.split(":", 1)[1].strip()
        elif line.startswith("Depends on:"):
            meta["depends"] = line.split(":", 1)[1].strip()
    return meta


def last_review_block(text: str) -> str:
    matches = list(REVIEW_HEADING.finditer(text))
    if not matches:
        return ""
    start = matches[-1].end()
    rest = text[start:]
    nxt = re.search(r"^## [^#]", rest, re.MULTILINE)
    return rest[: nxt.start()] if nxt else rest


def first_line_matching(block: str, pattern: str) -> str:
    for line in block.splitlines():
        if re.search(pattern, line, re.I):
            return line.strip()
    return ""


def classify_proof(text: str, tid: int | None) -> str:
    if tid in SPEC_ONLY_IDS:
        return "spec_only"
    if "## Execution receipt" not in text:
        return "stub"
    if "docs/receipts/staging/" not in text:
        if re.search(r"bun test|verify:v0|unit", text, re.I):
            return "unit_only"
        return "spec_only" if tid in SPEC_ONLY_IDS else "unit_only"
    if re.search(r"Not run:|still open|blocked", text, re.I):
        return "blocked"
    return "proven"


def should_reopen_done(text: str, tid: int | None, folder: str, proof_class: str) -> tuple[bool, str]:
    if folder != "_Done":
        return False, ""

    block = last_review_block(text)
    if not block and proof_class == "stub":
        return True, "no Execution receipt in _Done"

    verdict_line = first_line_matching(block, r"^Verdict:")
    verdict = verdict_line.lower()

    if re.search(r"do not move", block, re.I):
        return True, verdict_line or "Do not move in latest review"

    if re.search(r"move to _done\?\:\s*no", block, re.I):
        return True, "Move to _Done?: No in latest review"

    if re.search(r"verdict:\s*(-1|blocked|fake-done|partial)", block, re.I):
        return True, verdict_line or "negative/partial verdict"

    if tid in CULTURE_KEEP_IDS and re.search(r"verdict:\s*(\+1|pass)", block, re.I):
        return False, "culture CI core +1 (unit)"

    if tid in SPEC_ONLY_IDS and re.search(r"verdict:\s*(\+1|pass)", block, re.I):
        return False, "spec-only ticket with +1"

    if tid is not None and tid <= FOUNDATION_MAX and re.search(r"verdict:\s*(\+1|pass)", block, re.I):
        return False, "foundation lane +1"

    if tid is not None and tid in CRAFT_RANGE and "docs/receipts/staging/" in text:
        if re.search(r"verdict:\s*(\+1|pass)", block, re.I):
            return False, "craft wave with staging receipt + +1"

    if tid is not None and tid in BUG_WAVE and "docs/receipts/staging/" in text:
        if re.search(r"verdict:\s*(\+1|pass)", block, re.I):
            return False, "bug wave with staging receipt + +1"

    if re.search(r"verdict:\s*(\+1|pass)", block, re.I):
        # +1 but staging missing for non-spec tickets
        if proof_class in {"unit_only", "stub"} and tid not in SPEC_ONLY_IDS:
            return True, f"+1 but proof_class={proof_class}"
        return False, verdict_line or "+1"

    if re.search(r"\*\*fail\*\*", block, re.I):
        return True, "Fail in latest review checklist"

    if re.search(r"(not met|staging proof pending)", block, re.I):
        return True, first_line_matching(block, r"(not met|staging proof pending)")

    if proof_class in {"stub", "unit_only"} and tid not in SPEC_ONLY_IDS:
        return True, f"proof_class={proof_class} without spec-only exemption"

    return False, "no reopen rule matched"


def scan_tickets() -> list[dict]:
    rows: list[dict] = []
    for folder in ["", "_Done", "_Parked"]:
        base = HQ if folder == "" else HQ / folder
        if not base.is_dir():
            continue
        for path in sorted(base.glob("[0-9]*.md")):
            text = path.read_text(encoding="utf-8")
            tid = ticket_id(path)
            meta = parse_meta(text)
            proof = classify_proof(text, tid)
            reopen, gap = should_reopen_done(text, tid, folder or "root", proof)
            rows.append(
                {
                    "id": tid,
                    "file": path.name,
                    "folder": folder or "root",
                    "owner": meta.get("owner", ""),
                    "depends": meta.get("depends", ""),
                    "proof_class": proof,
                    "reopen": reopen,
                    "open_gaps": gap,
                    "path": path,
                }
            )
    rows.sort(key=lambda r: (r["id"] or 9999, r["folder"]))
    return rows


def write_audit(rows: list[dict]) -> None:
    branch, sha = git_info()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    counts: dict[str, int] = {}
    for r in rows:
        counts[r["folder"]] = counts.get(r["folder"], 0) + 1

    reopen_done = [r for r in rows if r["folder"] == "_Done" and r["reopen"]]

    lines = [
        "# HQ ticket audit",
        "",
        f"Generated: {now}",
        f"Branch: {branch} @ {sha}",
        "",
        "## Counts",
        f"- `_Done/`: {counts.get('_Done', 0)} tickets",
        f"- `_Parked/`: {counts.get('_Parked', 0)} tickets",
        f"- root queue: {counts.get('root', 0)} tickets",
        "",
        "## Reopen summary",
        f"- `_Done` tickets flagged for reopen: **{len(reopen_done)}**",
        "",
        "## Full audit",
        "",
        "| id | folder | owner | depends | proof_class | reopen? | open_gaps |",
        "|---:|---|---|---|---|---|---|",
    ]
    for r in rows:
        tid = r["id"] if r["id"] is not None else "?"
        lines.append(
            f"| {tid} | `{r['folder']}/` | {r['owner']} | {r['depends']} | {r['proof_class']} | "
            f"{'yes' if r['reopen'] else 'no'} | {r['open_gaps'].replace('|', '/')} |"
        )

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(rows)} tickets, {len(reopen_done)} reopen)")


def append_reopen(path: Path, reason: str) -> None:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    block = f"""
## Reopened ({today})

Reason: {reason}
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: {today}
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.
"""
    path.write_text(path.read_text(encoding="utf-8") + block, encoding="utf-8")


def apply_reopens(rows: list[dict], dry_run: bool) -> int:
    n = 0
    for r in rows:
        if r["folder"] != "_Done" or not r["reopen"]:
            continue
        src = r["path"]
        dst = HQ / src.name
        if dry_run:
            print(f"DRY reopen: {src.name} -> root ({r['open_gaps']})")
            n += 1
            continue
        append_reopen(src, r["open_gaps"])
        subprocess.run(["git", "mv", str(src), str(dst)], cwd=ROOT, check=True)
        print(f"Reopened: {src.name}")
        n += 1
    return n


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit HQ tickets")
    parser.add_argument("--apply-reopen", action="store_true", help="Move flagged _Done tickets to root")
    parser.add_argument("--dry-run", action="store_true", help="With --apply-reopen, print only")
    args = parser.parse_args()

    rows = scan_tickets()
    write_audit(rows)
    if args.apply_reopen:
        moved = apply_reopens(rows, dry_run=args.dry_run)
        print(f"{'Would move' if args.dry_run else 'Moved'} {moved} tickets to root")
        if not args.dry_run and moved:
            rows = scan_tickets()
            write_audit(rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
