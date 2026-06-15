#!/usr/bin/env bash
# Sequential p0 then p1 ship queue (one Cursor Auto agent per issue).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${OTTO_SHIP_LOG_DIR:-/tmp/otto-p0p1-ship}"
mkdir -p "$LOG_DIR"
QUEUE_LOG="$LOG_DIR/queue.log"
WORKER="$ROOT/scripts/ship-issue-worker.sh"

cd "$ROOT"

python3 << 'PY' >"$LOG_DIR/queue.tsv"
import json, subprocess, re

skip_blocked = {149, 670, 671}
skip_parents = {527, 546, 456}
skip_epic = {452, 453, 454, 455}

def issues(label):
    return json.loads(subprocess.check_output(
        ["gh", "issue", "list", "--state", "open", "--label", label, "--limit", "200", "--json", "number,title"]
    ))

p0 = issues("p0")
p1 = issues("p1")
ordered = [(i["number"], i["title"], "p0") for i in sorted(p0, key=lambda x: x["number"])]
ordered += [(i["number"], i["title"], "p1") for i in sorted(p1, key=lambda x: x["number"])]

prs = json.loads(subprocess.check_output(
    ["gh", "pr", "list", "--state", "open", "--limit", "200", "--json", "number,body,labels,statusCheckRollup"]
))

def fixes_n(body, n):
    if not body:
        return False
    patterns = [rf"(?i)\bfixes\s+#?\s*{n}\b", rf"(?i)\bclose[s]?\s+#?\s*{n}\b"]
    return any(re.search(p, body) for p in patterns)

def has_ready(labels):
    return any(l.get("name") == "status: ready for review" for l in labels)

def ci_green(rollup):
    if not rollup:
        return None
    for c in rollup:
        st = (c.get("state") or "").upper()
        con = (c.get("conclusion") or "").upper()
        if st in ("FAILURE", "ERROR") or con in ("FAILURE", "ERROR", "CANCELLED", "TIMED_OUT"):
            return False
        if st in ("PENDING", "IN_PROGRESS", "QUEUED", "WAITING") or con in ("PENDING",):
            return False
    return True

for num, title, pri in ordered:
    if num in skip_blocked or num in skip_parents or num in skip_epic:
        continue
    matched = [p for p in prs if fixes_n(p.get("body", ""), num)]
    if matched:
        p = matched[0]
        if has_ready(p.get("labels", [])) and ci_green(p.get("statusCheckRollup")):
            continue
        print(f"{num}\t{title.replace(chr(9), ' ')}\tbabysit\t{p['number']}")
    else:
        print(f"{num}\t{title.replace(chr(9), ' ')}\timplement\t")
PY

echo "Queue $(wc -l <"$LOG_DIR/queue.tsv" | tr -d ' ') issues — $(date -Iseconds)" | tee -a "$QUEUE_LOG"

while IFS=$'\t' read -r num title mode pr; do
  [[ -n "$num" ]] || continue
  echo ">>> issue #${num} (${mode}) pr=${pr:-none} $(date -Iseconds)" | tee -a "$QUEUE_LOG"
  if [[ "$mode" == "babysit" ]]; then
    "$WORKER" "$num" "$title" babysit "$pr" || echo "FAILED #${num} see $LOG_DIR/issue-${num}.log" | tee -a "$QUEUE_LOG"
  else
    "$WORKER" "$num" "$title" implement || echo "FAILED #${num} see $LOG_DIR/issue-${num}.log" | tee -a "$QUEUE_LOG"
  fi
  sleep 2
done <"$LOG_DIR/queue.tsv"
