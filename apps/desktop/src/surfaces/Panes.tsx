import React, { useEffect, useMemo, useState } from 'react';
import {
  readiness,
  requiredMissing,
  type ReadyItem,
  type ReadyStatus,
} from '../readiness';
import { Icon } from '../components/icons';
import {
  ottoApi,
  type CharterDetail,
  type CharterListResult,
  type CharterStatus,
  type CurationProposalRecord,
  type PracticeListResult,
  type PracticeRecord,
  type ReceiptDetail,
  type ReceiptListResult,
  type ReceiptStatus,
  type ReceiptSummary,
  type ProposalListResult,
  type RoutineActivationGate,
  type RoutineListResult,
  type RoutineRecord,
  type RuntimeStatus,
  type AutonomyPolicyResult,
  type AutonomyActionEvaluation,
  type StandardListResult,
  type StandardRecord,
  type StatusCode,
} from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';

const statusPill = (s: string) => {
  const cls = s === 'active' || s === 'success' || s === 'complete' ? 'pill--ok'
    : s === 'blocked' || s === 'pending' ? 'pill--warn'
    : s === 'failed' ? 'pill--stop'
    : s === 'proposed' || s === 'running' || s === 'draft' ? 'pill--info' : '';
  return <span className={`pill ${cls}`}>{s}</span>;
};

const EmptySurface: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
  path?: string;
  next?: string;
}> = ({ eyebrow, title, body, path, next }) => (
  <div className="emptySurface">
    <div className="eyebrow">{eyebrow}</div>
    <h2>{title}</h2>
    <p>{body}</p>
    {path && <span className="filechip">{Icon.file} {path}</span>}
    {next && <div className="notice"><span className="dot dot--idle" /> {next}</div>}
  </div>
);

/* ---------- Charters ---------- */
const CHARTER_STATUSES: CharterStatus[] = ['proposed', 'draft', 'active', 'blocked', 'complete', 'cancelled'];

export const Charters: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<CharterListResult | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<CharterDetail | null>(null);
  const [objective, setObjective] = useState('');
  const [slug, setSlug] = useState('');
  const [criterion, setCriterion] = useState('');
  const [statusDraft, setStatusDraft] = useState<CharterStatus>('active');
  const [statusSummary, setStatusSummary] = useState('');
  const [runId, setRunId] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshList = async (preferSlug?: string) => {
    if (!api) return;
    const next = await api.charters.list();
    setResult(next);
    setSelectedSlug((current) => {
      if (preferSlug && next.charters.some((charter) => charter.slug === preferSlug)) return preferSlug;
      if (current && next.charters.some((charter) => charter.slug === current)) return current;
      return next.charters[0]?.slug ?? null;
    });
  };

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.charters.list().then((next) => {
      if (cancelled) return;
      setResult(next);
      setSelectedSlug(next.charters[0]?.slug ?? null);
    }).catch((e) => {
      if (!cancelled) setError(String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!api || !selectedSlug) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    api.charters.get(selectedSlug).then((next) => {
      if (!cancelled) {
        setDetail(next);
        if (next) setStatusDraft(next.status);
      }
    }).catch(() => {
      if (!cancelled) setDetail(null);
    });
    return () => {
      cancelled = true;
    };
  }, [api, selectedSlug]);

  if (!api) {
    return (
      <EmptySurface
        eyebrow="charters"
        title="Charters are available in the desktop app."
        body="The web preview cannot read the local charter store. The desktop app reads real otto.charter.v1 files."
        path="~/.otto/charters/"
        next="Open the packaged desktop app to create and inspect Charters."
      />
    );
  }

  const charters = result?.charters ?? [];

  const createCharter = async () => {
    const cleanObjective = objective.trim();
    const cleanCriterion = criterion.trim();
    if (!cleanObjective || !cleanCriterion) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.charters.create({
        slug: slug.trim() || slugify(cleanObjective),
        objective: cleanObjective,
        status: 'active',
        acceptanceCriteria: [{ id: 'AC1', text: cleanCriterion }],
      });
      setObjective('');
      setSlug('');
      setCriterion('');
      await refreshList(created.charter.slug);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async () => {
    if (!detail || detail.status === statusDraft) return;
    setBusy(true);
    setError(null);
    try {
      await api.charters.updateStatus(detail.slug, statusDraft, statusSummary.trim() || `Charter status changed to ${statusDraft}.`);
      const next = await api.charters.get(detail.slug);
      setDetail(next);
      setStatusSummary('');
      await refreshList(detail.slug);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const linkRunReceipt = async () => {
    if (!detail || (!runId.trim() && !receiptId.trim())) return;
    setBusy(true);
    setError(null);
    try {
      await api.charters.linkRunReceipt(detail.slug, {
        runId: runId.trim() || undefined,
        receiptId: receiptId.trim() || undefined,
        summary: 'Charter linked to run/receipt evidence.',
      });
      const next = await api.charters.get(detail.slug);
      setDetail(next);
      setRunId('');
      setReceiptId('');
      await refreshList(detail.slug);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="charterSurface">
      <div className="panel charterCreate">
        <div>
          <div className="eyebrow">new charter</div>
          <div className="h-sec" style={{ marginTop: 6 }}>Operating contract</div>
        </div>
        <label className="charterField">
          <span>Objective</span>
          <input
            className="charterInput"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Represent an explicit goal/run contract"
          />
        </label>
        <label className="charterField">
          <span>Acceptance criterion</span>
          <input
            className="charterInput"
            value={criterion}
            onChange={(e) => setCriterion(e.target.value)}
            placeholder="A concrete proof condition"
          />
        </label>
        <label className="charterField">
          <span>Slug</span>
          <input
            className="charterInput mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={objective ? slugify(objective) : 'auto'}
          />
        </label>
        <button className="btn btn--primary" onClick={createCharter} disabled={busy || !objective.trim() || !criterion.trim()}>
          Create charter
        </button>
      </div>
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      <div className="split">
        <div className="cards charterList" aria-label="Charters list">
          {charters.map((charter) => (
            <button
              key={charter.slug}
              className={`card${charter.slug === selectedSlug ? ' is-selected' : ''}`}
              onClick={() => setSelectedSlug(charter.slug)}
            >
              <div className="between">
                <span className="card__title">{charter.slug}</span>
                {statusPill(charter.status)}
              </div>
              <span className="card__sub">
                {charter.acceptance_criteria.length} AC · {charter.run_ids.length} run{charter.run_ids.length === 1 ? '' : 's'} · {charter.receipt_ids.length} receipt{charter.receipt_ids.length === 1 ? '' : 's'}
              </span>
            </button>
          ))}
          {!charters.length && (
            <div className="panel charterEmptyList">
              <div className="h-sec">No charters yet</div>
              <p className="muted" style={{ marginTop: 6 }}>Create one to start the local proof trail.</p>
            </div>
          )}
          <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/charters'}</span>
        </div>

        <CharterDetailView
          detail={detail}
          statusDraft={statusDraft}
          statusSummary={statusSummary}
          runId={runId}
          receiptId={receiptId}
          busy={busy}
          setStatusDraft={setStatusDraft}
          setStatusSummary={setStatusSummary}
          setRunId={setRunId}
          setReceiptId={setReceiptId}
          onUpdateStatus={updateStatus}
          onLinkRunReceipt={linkRunReceipt}
        />
      </div>
    </div>
  );
};

const CharterDetailView: React.FC<{
  detail: CharterDetail | null;
  statusDraft: CharterStatus;
  statusSummary: string;
  runId: string;
  receiptId: string;
  busy: boolean;
  setStatusDraft: (status: CharterStatus) => void;
  setStatusSummary: (value: string) => void;
  setRunId: (value: string) => void;
  setReceiptId: (value: string) => void;
  onUpdateStatus: () => void;
  onLinkRunReceipt: () => void;
}> = ({
  detail,
  statusDraft,
  statusSummary,
  runId,
  receiptId,
  busy,
  setStatusDraft,
  setStatusSummary,
  setRunId,
  setReceiptId,
  onUpdateStatus,
  onLinkRunReceipt,
}) => {
  if (!detail) {
    return (
      <div className="detail">
        <div className="panel">
          <div className="h-sec">Select a charter</div>
          <p className="muted" style={{ marginTop: 6 }}>Charter state appears after creation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail charterDetail">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">charter detail</div>
            <div className="h-sec" style={{ marginTop: 6 }}>{detail.title}</div>
          </div>
          {statusPill(detail.status)}
        </div>
        <p className="lede" style={{ marginTop: 8 }}>{detail.objective}</p>
        <dl className="kv charterKv">
          <div><dt>schema</dt><dd>{detail.schema}</dd></div>
          <div><dt>id</dt><dd className="mono">{detail.id}</dd></div>
          <div><dt>slug</dt><dd className="mono">{detail.slug}</dd></div>
          <div><dt>file</dt><dd className="mono">{detail.path}</dd></div>
        </dl>
      </div>

      <div className="grid grid--2">
        <div className="panel">
          <div className="eyebrow">acceptance criteria</div>
          <ul className="list">
            {detail.acceptance_criteria.map((ac) => (
              <li key={ac.id}>
                <strong>{ac.id}</strong> {ac.text}
                {!!ac.receipts.length && <span className="faint"> · {ac.receipts.length} receipt{ac.receipts.length === 1 ? '' : 's'}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="eyebrow">approval boundary</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {detail.approval_required_for_changes.map((gate) => <span className="pill pill--warn" key={gate}>{gate}</span>)}
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="panel">
          <div className="eyebrow">linked runs</div>
          <ChipList values={detail.run_ids} empty="No run linked" />
        </div>
        <div className="panel">
          <div className="eyebrow">linked receipts</div>
          <ChipList values={detail.receipt_ids} empty="No receipt linked" />
        </div>
      </div>

      <div className="grid grid--2">
        <div className="panel charterAction">
          <div className="eyebrow">attach run / receipt</div>
          <input className="charterInput mono" value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="run id" aria-label="Run ID" />
          <input className="charterInput mono" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} placeholder="receipt id" aria-label="Receipt ID" />
          <button className="btn" onClick={onLinkRunReceipt} disabled={busy || (!runId.trim() && !receiptId.trim())}>Attach</button>
        </div>
        <div className="panel charterAction">
          <div className="eyebrow">update status</div>
          <select className="charterInput" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as CharterStatus)} aria-label="Charter status">
            {CHARTER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input className="charterInput" value={statusSummary} onChange={(e) => setStatusSummary(e.target.value)} placeholder="change summary" aria-label="Status change summary" />
          <button className="btn" onClick={onUpdateStatus} disabled={busy || statusDraft === detail.status}>Update</button>
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow">changes</div>
        <div className="charterChanges">
          {detail.changes.map((change) => (
            <div className="zone charterChangeRow" key={change.id}>
              <span className="zone__tag">{change.kind}</span>
              <div>
                <div className="muted">{change.summary}</div>
                <div className="faint mono" style={{ marginTop: 4 }}>
                  {formatReceiptTime(change.at)} · {change.receipt_id}
                  {change.from_status && change.to_status ? ` · ${change.from_status} -> ${change.to_status}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChipList: React.FC<{ values: string[]; empty: string }> = ({ values, empty }) => (
  <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
    {values.length ? values.map((value) => <span className="filechip" key={value}>{value}</span>) : <span className="faint">{empty}</span>}
  </div>
);

/* ---------- Standards ---------- */
export const Standards: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<StandardListResult | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.standards.list()
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setSelectedSlug(next.standards[0]?.slug ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (!api) {
    return (
      <EmptySurface
        eyebrow="standards"
        title="Standards are available in the desktop app."
        body="The web preview cannot read the local Standards files. The desktop app loads the repo or packaged file-backed canon."
        path="standards/registry.yaml"
        next="Open the packaged desktop app to inspect current Standards."
      />
    );
  }

  const standards = result?.standards ?? [];
  const selected = standards.find((standard) => standard.slug === selectedSlug) ?? standards[0] ?? null;

  return (
    <div className="standardsSurface">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">file-backed canon</div>
            <div className="h-sec">Standards registry</div>
          </div>
          <span className="pill pill--ok">files</span>
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          Current Standards load from `standards/registry.yaml` and the Markdown/YAML files it references.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="filechip">{Icon.file} {result?.registryPath ?? 'standards/registry.yaml'}</span>
          <span className="filechip">{result?.standards.length ?? 0} standards</span>
          <span className="filechip">{result?.skipped.length ?? 0} skipped</span>
        </div>
        {result && (
          <div className="zone" style={{ marginTop: 14 }}>
            <span className="zone__tag">ratification</span>
            <span>
              {result.registry.ratification.owner} owns changes · auto apply {String(result.registry.ratification.auto_apply ?? false)}
            </span>
          </div>
        )}
      </div>

      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      <div className="split">
        <div className="cards">
          {standards.map((standard) => (
            <button
              key={standard.slug}
              className={`card${standard.slug === selected?.slug ? ' is-selected' : ''}`}
              onClick={() => setSelectedSlug(standard.slug)}
            >
              <div className="between">
                <span className="card__title">{standard.name}</span>
                {statusPill(standard.status)}
              </div>
              <span className="card__sub">{standard.meaning}</span>
            </button>
          ))}
          {!standards.length && (
            <div className="panel">
              <div className="h-sec">No Standards loaded</div>
              <p className="muted" style={{ marginTop: 6 }}>The loader could not read file-backed Standards.</p>
            </div>
          )}
        </div>

        {selected && <StandardDetail standard={selected} />}
      </div>
    </div>
  );
};

const StandardDetail: React.FC<{ standard: StandardRecord }> = ({ standard }) => (
  <div className="detail">
    <div className="panel">
      <div className="between">
        <div>
          <div className="eyebrow">standard detail</div>
          <div className="h-sec">{standard.name}</div>
        </div>
        {statusPill(standard.status)}
      </div>
      <p className="lede" style={{ marginTop: 8 }}>{standard.meaning}</p>
      <dl className="kv charterKv">
        <div><dt>schema</dt><dd>{standard.schema}</dd></div>
        <div><dt>slug</dt><dd className="mono">{standard.slug}</dd></div>
        <div><dt>version</dt><dd>{standard.version}</dd></div>
        <div><dt>file</dt><dd className="mono">{standard.file}</dd></div>
      </dl>
    </div>

    <div className="grid grid--2">
      <div className="panel">
        <div className="eyebrow">under pressure · do</div>
        <ul className="list">{standard.under_pressure.do.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="panel">
        <div className="eyebrow">under pressure · refuse</div>
        <ul className="list">{standard.under_pressure.refuse.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>

    <div className="grid grid--2">
      <div className="panel">
        <div className="eyebrow">evidence</div>
        <ul className="list">{standard.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="panel">
        <div className="eyebrow">citation path</div>
        <p className="muted">Receipts cite this file by slug and path.</p>
        <span className="filechip" style={{ marginTop: 10 }}>{standard.slug} · {standard.file}</span>
      </div>
    </div>
  </div>
);

/* ---------- Practices ---------- */
export const Practices: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<PracticeListResult | null>(null);
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    Promise.all([api.practices.list(), api.receipts.list()])
      .then(([practiceResult, receiptResult]) => {
        if (cancelled) return;
        setResult(practiceResult);
        setReceipts(receiptResult.receipts);
        setSelectedSlug(practiceResult.practices[0]?.slug ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (!api) {
    return (
      <EmptySurface
        eyebrow="practices"
        title="Practices are available in the desktop app."
        body="The web preview cannot read local practice files. The desktop app loads the repo or packaged file-backed canon."
        path="practices/"
        next="Open the packaged desktop app to inspect current Practices."
      />
    );
  }

  const practices = result?.practices ?? [];
  const selected = practices.find((practice) => practice.slug === selectedSlug) ?? practices[0] ?? null;
  const relatedReceipts = selected
    ? receipts.filter((receipt) => receipt.practiceSlug === selected.slug).slice(0, 8)
    : [];

  return (
    <div className="standardsSurface">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">file-backed canon</div>
            <div className="h-sec">Practices registry</div>
          </div>
          <span className="pill pill--ok">files</span>
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          Practices load from `practices/*/practice.yaml`. Consequential edits go through Curation — no silent canon changes.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="filechip">{Icon.file} {result?.dir ?? 'practices/'}</span>
          <span className="filechip">{practices.length} practices</span>
          <span className="filechip">{result?.skipped.length ?? 0} skipped</span>
        </div>
        <div className="zone" style={{ marginTop: 14 }}>
          <span className="zone__tag">curation gate</span>
          <span>
            Practice promotion, activation, and publish remain approval-gated. Edit `practice.yaml` through a Curation proposal — not inline here.
          </span>
        </div>
      </div>

      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      <div className="split">
        <div className="cards">
          {practices.map((practice) => (
            <button
              key={practice.slug}
              className={`card${practice.slug === selected?.slug ? ' is-selected' : ''}`}
              onClick={() => setSelectedSlug(practice.slug)}
            >
              <div className="between">
                <span className="card__title">{practice.name}</span>
                {statusPill(practice.status)}
              </div>
              <span className="card__sub">{practice.summary}</span>
            </button>
          ))}
          {!practices.length && <div className="faint">No practices loaded.</div>}
        </div>
        {selected && <PracticeDetail practice={selected} relatedReceipts={relatedReceipts} />}
      </div>
    </div>
  );
};

const PracticeDetail: React.FC<{ practice: PracticeRecord; relatedReceipts: ReceiptSummary[] }> = ({ practice, relatedReceipts }) => (
  <div className="detail">
    <div className="panel">
      <div className="between">
        <div className="h-sec">{practice.name}</div>
        {statusPill(practice.status)}
      </div>
      <p className="lede" style={{ marginTop: 6 }}>{practice.summary}</p>
      <ChipList values={practice.invocations ?? []} empty="No invocations declared." />
    </div>
    <div className="grid grid--2">
      <div className="panel">
        <div className="eyebrow">guardrails</div>
        <ul className="list">{(practice.guardrails ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
      <div className="panel">
        <div className="eyebrow">evidence standard</div>
        <ul className="list">{(practice.evidence_standard ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">approval floor · cannot be bypassed</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {(practice.approval_required_for ?? []).map((item) => <span className="pill pill--warn" key={item}>{item}</span>)}
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">citation path</div>
      <p className="muted">Receipts link invocations back to this file by slug and path.</p>
      <span className="filechip" style={{ marginTop: 10 }}>{practice.slug} · {practice.file}</span>
    </div>
    <div className="panel">
      <div className="eyebrow">related receipts</div>
      {relatedReceipts.length ? (
        <div className="receiptEvidence" style={{ marginTop: 12 }}>
          {relatedReceipts.map((receipt) => (
            <div className="zone receiptEvidenceRow" key={receipt.id}>
              <span className="zone__tag">{receipt.status}</span>
              <div>
                <div className="card__title">{receipt.summary}</div>
                <div className="mono receiptEvidenceRef" style={{ marginTop: 4 }}>{receipt.id}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 8 }}>No receipts cite this practice yet.</p>
      )}
    </div>
  </div>
);

/* ---------- Routines ---------- */
export const Routines: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<RoutineListResult | null>(null);
  const [gate, setGate] = useState<RoutineActivationGate | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.routines.list()
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setSelectedSlug(next.routines[0]?.slug ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!api || !selectedSlug) return;
    let cancelled = false;
    api.routines.activationGate(selectedSlug)
      .then((next) => {
        if (!cancelled) setGate(next);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api, selectedSlug]);

  if (!api) {
    return (
      <EmptySurface
        eyebrow="routines"
        title="Routines are available in the desktop app."
        body="The web preview cannot read local routine files. The desktop app loads the repo or packaged file-backed canon."
        path="routines/"
        next="Open the packaged desktop app to inspect and manually run Routines."
      />
    );
  }

  const routines = result?.routines ?? [];
  const selected = routines.find((routine) => routine.slug === selectedSlug) ?? routines[0] ?? null;

  const runManual = async () => {
    if (!api || !selected || busy) return;
    setBusy(true);
    setRunMessage(null);
    setError(null);
    try {
      const run = await api.routines.runManual(selected.slug);
      setRunMessage(`Manual run recorded: ${run.receipt.id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="standardsSurface">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">file-backed canon</div>
            <div className="h-sec">Routines</div>
          </div>
          <span className="pill pill--ok">files</span>
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          Routines bundle Practice invocations. Manual runs write receipts immediately; recurring activation stays approval-gated.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="filechip">{Icon.file} {result?.dir ?? 'routines/'}</span>
          <span className="filechip">{routines.length} routines</span>
        </div>
      </div>

      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {runMessage && <div className="notice"><span className="dot dot--ok" /> {runMessage}</div>}

      <div className="split">
        <div className="cards">
          {routines.map((routine) => (
            <button
              key={routine.slug}
              className={`card${routine.slug === selected?.slug ? ' is-selected' : ''}`}
              onClick={() => setSelectedSlug(routine.slug)}
            >
              <div className="between">
                <span className="card__title">{routine.name}</span>
                {statusPill(routine.status)}
              </div>
              <span className="card__sub">{routine.summary}</span>
            </button>
          ))}
        </div>
        {selected && (
          <RoutineDetail routine={selected} gate={gate} busy={busy} onRunManual={runManual} />
        )}
      </div>
    </div>
  );
};

const RoutineDetail: React.FC<{
  routine: RoutineRecord;
  gate: RoutineActivationGate | null;
  busy: boolean;
  onRunManual: () => void;
}> = ({ routine, gate, busy, onRunManual }) => (
  <div className="detail">
    <div className="panel">
      <div className="between">
        <div className="h-sec">{routine.name}</div>
        {statusPill(routine.status)}
      </div>
      <p className="lede" style={{ marginTop: 6 }}>{routine.summary}</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span className="filechip">attention: {routine.attention_cost}</span>
        {routine.schedule?.cron && <span className="filechip">cron: {routine.schedule.cron}</span>}
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">steps</div>
      <div className="receiptEvidence" style={{ marginTop: 12 }}>
        {routine.steps.map((step, index) => (
          <div className="zone receiptEvidenceRow" key={`${step.practice}-${index}`}>
            <span className="zone__tag">{step.practice}</span>
            <div>
              <div className="mono">{step.invocation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">activation gate</div>
      <p className="lede" style={{ marginTop: 8 }}>{gate?.reason ?? 'Checking activation gate…'}</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span className={`pill ${gate?.allowed ? 'pill--ok' : 'pill--warn'}`}>
          recurring activation {gate?.allowed ? 'allowed' : 'blocked'}
        </span>
        {gate?.requiresApproval && <span className="pill pill--warn">approval required</span>}
      </div>
    </div>
    <div className="panel">
      <div className="between">
        <div>
          <div className="eyebrow">manual run</div>
          <p className="muted" style={{ marginTop: 6 }}>Records a receipt without enabling recurring activation.</p>
        </div>
        <button className="btn btn--primary" disabled={busy} onClick={onRunManual}>
          {busy ? 'Running…' : 'Run manually'}
        </button>
      </div>
      <span className="filechip" style={{ marginTop: 12 }}>{routine.slug} · {routine.file}</span>
    </div>
  </div>
);

/* ---------- Curation (proposals + approvals) ---------- */

type ProposalInboxFilter = 'pending' | 'decided' | 'all';

const PENDING_STATUSES = new Set(['proposed', 'needs_approval', 'deferred']);
const isPendingProposal = (status: string) => PENDING_STATUSES.has(status);
const canDecideProposal = (status: string) => status === 'proposed' || status === 'needs_approval' || status === 'deferred';

export const Curation: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<ProposalListResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProposalInboxFilter>('pending');
  const [error, setError] = useState<string | null>(null);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    if (!api) return Promise.resolve();
    return api.curation.proposals.list()
      .then((next) => setResult(next))
      .catch((e) => setError(String(e)));
  };

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.curation.proposals.list()
      .then((next) => {
        if (!cancelled) setResult(next);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const proposals = result?.proposals ?? [];
  const filtered = useMemo(() => {
    if (filter === 'all') return proposals;
    if (filter === 'pending') return proposals.filter((p) => isPendingProposal(p.status));
    return proposals.filter((p) => !isPendingProposal(p.status));
  }, [filter, proposals]);

  const selected = filtered.find((p) => p.id === selectedId)
    ?? filtered[0]
    ?? proposals.find((p) => p.id === selectedId)
    ?? proposals[0]
    ?? null;

  if (!api) {
    return (
      <EmptySurface
        eyebrow="curation"
        title="Curation inbox is available in the desktop app."
        body="The web preview cannot read local proposal files. The desktop app loads proposals from ~/.otto/curation/proposals/."
        path="~/.otto/curation/proposals/"
        next="Open the packaged desktop app to inspect pending canon proposals."
      />
    );
  }

  const pendingCount = proposals.filter((p) => isPendingProposal(p.status)).length;
  const decidedCount = proposals.length - pendingCount;

  const decide = async (decision: 'accept' | 'reject' | 'defer') => {
    if (!api || !selected || busy || !canDecideProposal(selected.status)) return;
    setBusy(true);
    setDecisionMessage(null);
    setError(null);
    try {
      const outcome = await api.curation.proposals.decide(selected.id, { decision });
      if (outcome.blocked) {
        setError(outcome.receipt.blocker?.message ?? 'Decision blocked');
      } else {
        setDecisionMessage(`${decision}: ${outcome.receipt.id}`);
      }
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="standardsSurface">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">curation inbox</div>
            <div className="h-sec">Proposals</div>
          </div>
          <span className="pill pill--ok">files</span>
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          Corrections become explicit proposals. Accept applies ratified canon changes with a receipt; reject and defer leave canon unchanged.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/curation/proposals/'}</span>
          <span className="filechip">{pendingCount} pending</span>
          <span className="filechip">{decidedCount} decided</span>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {(['pending', 'decided', 'all'] as const).map((key) => (
            <button
              key={key}
              className={`btn${filter === key ? ' btn--primary' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {decisionMessage && <div className="notice"><span className="dot dot--ok" /> {decisionMessage}</div>}

      {filtered.length === 0 ? (
        <div className="panel">
          <div className="h-sec">No {filter === 'all' ? '' : `${filter} `}proposals</div>
          <p className="muted" style={{ marginTop: 8 }}>
            {filter === 'pending'
              ? 'User corrections routed through createFromCorrection will appear here as needs_approval.'
              : 'Decided proposals (applied, rejected) will appear in this view.'}
          </p>
        </div>
      ) : (
        <div className="split">
          <div className="cards">
            {filtered.map((proposal) => (
              <button
                key={proposal.id}
                className={`card${proposal.id === selected?.id ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(proposal.id)}
              >
                <div className="between">
                  <span className="card__title">{proposal.summary}</span>
                  {statusPill(proposal.status)}
                </div>
                <span className="card__sub">{proposal.kind} · {proposal.classification.required_gate}</span>
              </button>
            ))}
          </div>
          {selected && (
            <ProposalDetail
              proposal={selected}
              busy={busy}
              canDecide={canDecideProposal(selected.status)}
              onAccept={() => decide('accept')}
              onReject={() => decide('reject')}
              onDefer={() => decide('defer')}
            />
          )}
        </div>
      )}
    </div>
  );
};

const ProposalDetail: React.FC<{
  proposal: CurationProposalRecord;
  busy: boolean;
  canDecide: boolean;
  onAccept: () => void;
  onReject: () => void;
  onDefer: () => void;
}> = ({ proposal, busy, canDecide, onAccept, onReject, onDefer }) => (
  <div className="detail">
    <div className="panel">
      <div className="between">
        <div className="h-sec">{proposal.summary}</div>
        {statusPill(proposal.status)}
      </div>
      <p className="lede" style={{ marginTop: 6 }}>{proposal.rationale}</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span className="filechip">source: {proposal.source}</span>
        <span className="filechip">kind: {proposal.kind}</span>
        {proposal.receipt_id && <span className="filechip">receipt: {proposal.receipt_id}</span>}
        {proposal.decision_receipt_id && <span className="filechip">decision: {proposal.decision_receipt_id}</span>}
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">classification</div>
      <div className="receiptEvidence" style={{ marginTop: 12 }}>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">risk</span>
          <div className="mono">{proposal.classification.risk} · {proposal.classification.route}</div>
        </div>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">gate</span>
          <div className="mono">{proposal.classification.required_gate}</div>
        </div>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">canon</span>
          <div className="mono">{proposal.classification.canon_impact}{proposal.target.id ? ` · ${proposal.target.id}` : ''}</div>
        </div>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">reason</span>
          <div>{proposal.classification.reason}</div>
        </div>
      </div>
    </div>
    <div className="panel">
      <div className="eyebrow">evidence</div>
      <div className="receiptEvidence" style={{ marginTop: 12 }}>
        {proposal.evidence.map((item, index) => (
          <div className="zone receiptEvidenceRow" key={`${item.ref}-${index}`}>
            <span className="zone__tag">{item.kind}</span>
            <div>
              <div className="mono">{item.ref}</div>
              {item.note && <div className="muted">{item.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
    {canDecide && (
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">decision</div>
            <p className="muted" style={{ marginTop: 6 }}>Accept applies canon when a target path is set. Reject and defer write receipts without canon mutation.</p>
          </div>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <button className="btn btn--primary" disabled={busy} onClick={onAccept}>Accept</button>
          <button className="btn" disabled={busy} onClick={onReject}>Reject</button>
          <button className="btn" disabled={busy} onClick={onDefer}>Defer</button>
        </div>
      </div>
    )}
    <div className="panel">
      <span className="filechip">{proposal.id} · {proposal.path}</span>
    </div>
  </div>
);

/* ---------- Receipts (runs + proof) ---------- */
const RECEIPT_FILTERS: Array<'all' | ReceiptStatus> = ['all', 'success', 'blocked', 'failed'];

export const Receipts: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<ReceiptListResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ReceiptStatus>('all');
  const [loading, setLoading] = useState(!!api);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.receipts.list()
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setSelectedId((current) =>
          current && next.receipts.some((receipt) => receipt.id === current)
            ? current
            : next.receipts[0]?.id ?? null,
        );
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!api || !selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    api.receipts.get(selectedId)
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, selectedId]);

  const receipts = result?.receipts ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return receipts.filter((receipt) => {
      if (filter !== 'all' && receipt.status !== filter) return false;
      if (!needle) return true;
      return [
        receipt.id,
        receipt.action,
        receipt.status,
        receipt.subjectType,
        receipt.subjectId ?? '',
        receipt.summary,
        receipt.blockerCode ?? '',
        receipt.path,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [filter, query, receipts]);
  const selectedSummary = receipts.find((receipt) => receipt.id === selectedId) ?? null;

  if (!api) {
    return (
      <EmptySurface
        eyebrow="receipts"
        title="Receipts are available in the desktop app."
        body="The web preview cannot read the local receipt directory. The desktop app reads real otto.receipt.v1 JSON files."
        path="~/.otto/receipts/"
        next="Open the packaged desktop app to inspect local proof."
      />
    );
  }

  if (!loading && !receipts.length) {
    return (
      <div className="receiptsSurface">
        <div className="panel receiptsToolbar">
          <div>
            <div className="eyebrow">local proof trail</div>
            <div className="h-sec" style={{ marginTop: 6 }}>No receipts yet</div>
            <p className="muted" style={{ marginTop: 6 }}>
              This surface reads real receipt files only. Send or block a chat turn to create an `otto.receipt.v1` record.
            </p>
          </div>
          <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/receipts'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="receiptsSurface">
      <div className="panel receiptsToolbar">
        <div>
          <div className="eyebrow">local proof trail</div>
          <div className="h-sec" style={{ marginTop: 6 }}>
            {loading ? 'Loading receipts...' : `${receipts.length} receipt${receipts.length === 1 ? '' : 's'}`}
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Real `otto.receipt.v1` JSON from the local desktop receipt directory.
            {!!result?.skipped && ` ${result.skipped} malformed file${result.skipped === 1 ? '' : 's'} skipped.`}
          </p>
        </div>
        <div className="receiptControls">
          <input
            className="receiptSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search receipts"
            aria-label="Search receipts"
          />
          <div className="segmented" role="tablist" aria-label="Receipt status filter">
            {RECEIPT_FILTERS.map((item) => (
              <button key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
        <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/receipts'}</span>
      </div>

      <div className="split receiptsSplit">
        <div className="cards receiptList" aria-label="Receipts list">
          {filtered.map((receipt) => (
            <button
              key={receipt.id}
              className={`card receiptCard${receipt.id === selectedId ? ' is-selected' : ''}`}
              onClick={() => setSelectedId(receipt.id)}
            >
              <div className="between">
                <span className="card__title">{receipt.action}</span>
                {statusPill(receipt.status)}
              </div>
              <span className="card__sub">{receipt.summary}</span>
              <span className="receiptCard__meta mono">
                {formatReceiptTime(receipt.timestamp)} · {receipt.subjectType}{receipt.subjectId ? `:${receipt.subjectId}` : ''}
              </span>
              {receipt.blockerCode && <span className="filechip">{receipt.blockerCode}</span>}
            </button>
          ))}
          {!filtered.length && (
            <div className="panel">
              <div className="h-sec">No matching receipts</div>
              <p className="muted" style={{ marginTop: 6 }}>Clear the search or status filter to inspect the full proof trail.</p>
            </div>
          )}
        </div>

        <ReceiptDetailView detail={detail} summary={selectedSummary} />
      </div>
    </div>
  );
};

const ReceiptDetailView: React.FC<{ detail: ReceiptDetail | null; summary: ReceiptListResult['receipts'][number] | null }> = ({ detail, summary }) => {
  if (!summary) {
    return (
      <div className="detail">
        <div className="panel">
          <div className="h-sec">Select a receipt</div>
          <p className="muted" style={{ marginTop: 6 }}>The detail pane shows the exact receipt contract fields.</p>
        </div>
      </div>
    );
  }

  if (!detail || detail.id !== summary.id) {
    return (
      <div className="detail">
        <div className="panel">
          <div className="h-sec">Loading receipt detail...</div>
          <p className="muted" style={{ marginTop: 6 }}>{summary.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail receiptDetail">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">receipt detail</div>
            <div className="h-sec" style={{ marginTop: 6 }}>{detail.result.summary}</div>
          </div>
          {statusPill(detail.status)}
        </div>
        <dl className="kv receiptKv">
          <div><dt>schema</dt><dd>{detail.schema}</dd></div>
          <div><dt>id</dt><dd className="mono">{detail.id}</dd></div>
          <div><dt>timestamp</dt><dd>{formatReceiptTime(detail.timestamp)}</dd></div>
          <div><dt>action</dt><dd>{detail.action}</dd></div>
          <div><dt>subject</dt><dd>{detail.subject.type}{detail.subject.id ? `:${detail.subject.id}` : ''}</dd></div>
          <div><dt>file</dt><dd className="mono">{detail.path}</dd></div>
        </dl>
      </div>

      {detail.blocker && (
        <div className="panel receiptBlocker">
          <div className="between">
            <div className="eyebrow">blocker</div>
            <span className="pill pill--warn">{detail.blocker.code}</span>
          </div>
          <p className="lede" style={{ marginTop: 8 }}>{detail.blocker.message}</p>
          {detail.blocker.next_action && <p className="muted" style={{ marginTop: 6 }}>{detail.blocker.next_action}</p>}
        </div>
      )}

      {!!detail.practice && (
        <div className="panel">
          <div className="eyebrow">practice invoked</div>
          <dl className="kv receiptKv" style={{ marginTop: 10 }}>
            <div><dt>name</dt><dd>{detail.practice.name}</dd></div>
            <div><dt>slug</dt><dd className="mono">{detail.practice.slug}</dd></div>
            <div><dt>invocation</dt><dd className="mono">{detail.practice.invocation}</dd></div>
            <div><dt>file</dt><dd className="mono">{detail.practice.ref}</dd></div>
          </dl>
        </div>
      )}

      {!!detail.routine && (
        <div className="panel">
          <div className="eyebrow">routine invoked</div>
          <dl className="kv receiptKv" style={{ marginTop: 10 }}>
            <div><dt>name</dt><dd>{detail.routine.name}</dd></div>
            <div><dt>slug</dt><dd className="mono">{detail.routine.slug}</dd></div>
            <div><dt>mode</dt><dd className="mono">{detail.routine.mode}</dd></div>
            <div><dt>file</dt><dd className="mono">{detail.routine.ref}</dd></div>
          </dl>
        </div>
      )}

      {!!detail.standards?.length && (
        <div className="panel">
          <div className="eyebrow">standards cited</div>
          <p className="muted" style={{ marginTop: 6 }}>This receipt links to file-backed Standards cited at write time.</p>
          <div className="receiptEvidence" style={{ marginTop: 12 }}>
            {detail.standards.map((citation) => (
              <div className="zone receiptEvidenceRow" key={citation.slug}>
                <span className="zone__tag">{citation.slug}</span>
                <div>
                  <div className="card__title">{citation.name}</div>
                  <div className="mono receiptEvidenceRef" style={{ marginTop: 4 }}>{citation.ref}</div>
                  <p className="muted" style={{ marginTop: 4 }}>{citation.reason}</p>
                  {!!citation.evidence?.length && (
                    <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {citation.evidence.map((item) => <span className="filechip" key={item}>{item}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid--2">
        <JsonPanel title="input" value={detail.input} />
        <JsonPanel title="result" value={detail.result} />
      </div>

      <div className="panel">
        <div className="eyebrow">evidence</div>
        <div className="receiptEvidence">
          {detail.evidence.map((entry, index) => (
            <div className="zone receiptEvidenceRow" key={`${entry.kind}-${entry.ref}-${index}`}>
              <span className="zone__tag">{entry.kind}</span>
              <div>
                <div className="mono receiptEvidenceRef">{entry.ref}</div>
                {entry.note && <p className="muted" style={{ marginTop: 4 }}>{entry.note}</p>}
                {!!entry.proves?.length && (
                  <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {entry.proves.map((proof) => <span className="filechip" key={proof}>{proof}</span>)}
                  </div>
                )}
                {entry.data !== undefined && <pre className="receiptJson mono">{pretty(entry.data)}</pre>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const JsonPanel: React.FC<{ title: string; value: unknown }> = ({ title, value }) => (
  <div className="panel">
    <div className="eyebrow">{title}</div>
    <pre className="receiptJson mono">{pretty(value)}</pre>
  </div>
);

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function formatReceiptTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

/* ---------- Autonomy ---------- */
const zoneClass = (zone: string) => {
  if (zone === 'green') return 'pill--ok';
  if (zone === 'yellow') return 'pill--warn';
  return 'pill--stop';
};

export const Autonomy: React.FC = () => {
  const api = ottoApi();
  const [loaded, setLoaded] = useState<AutonomyPolicyResult | null>(null);
  const [actionText, setActionText] = useState('run tests in worktree');
  const [evaluation, setEvaluation] = useState<AutonomyActionEvaluation | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.autonomy.policy()
      .then((next) => {
        if (!cancelled) setLoaded(next);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (!api) {
    return (
      <EmptySurface
        eyebrow="autonomy"
        title="Autonomy policy is available in the desktop app."
        body="The web preview cannot read autonomy/policy.yaml. Open the packaged desktop app to inspect zones, doors, and action classification."
        path="autonomy/policy.yaml"
        next="Policy governs classification only — Ticketcraft orchestration is not automated in v1."
      />
    );
  }

  const policy = loaded?.policy;

  const evaluate = async () => {
    if (!api || busy || !actionText.trim()) return;
    setBusy(true);
    setError(null);
    setReceiptId(null);
    try {
      const result = await api.autonomy.evaluateAction({ action: actionText.trim(), context: 'autonomy-surface' });
      setEvaluation(result.evaluation);
      setReceiptId(result.receipt.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="standardsSurface">
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">file-backed policy</div>
            <div className="h-sec">Autonomy</div>
          </div>
          <span className="pill pill--ok">{loaded?.storage ?? 'loading'}</span>
        </div>
        <p className="lede" style={{ marginTop: 8 }}>
          {policy?.summary ?? 'Loading policy…'} Otto may act alone only inside visible green-zone boundaries; consequential doors always escalate.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="filechip">{Icon.file} {loaded?.policyPath ?? 'autonomy/policy.yaml'}</span>
          <span className="filechip">safe_auto_merge: {policy?.settings.safe_auto_merge ?? '…'}</span>
        </div>
      </div>

      {policy?.limitations.length ? (
        <div className="notice">
          <span className="dot dot--warn" />
          {policy.limitations[0]}
        </div>
      ) : null}

      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      <div className="grid grid--3">
        {(policy?.zones ?? []).map((zone) => (
          <div className="panel" key={zone.id}>
            <div className="between">
              <div className="eyebrow">{zone.id}</div>
              <span className={`pill ${zoneClass(zone.id)}`}>{zone.requires_approval ? 'approval' : 'autonomous'}</span>
            </div>
            <div className="card__title" style={{ marginTop: 8 }}>{zone.label}</div>
            <p className="muted" style={{ marginTop: 6 }}>{zone.summary}</p>
            <ul className="list" style={{ marginTop: 10 }}>
              {zone.examples.slice(0, 4).map((example, index) => <li key={index}>{example}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="eyebrow">consequential doors</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {(policy?.doors ?? []).map((door) => (
            <span className="pill pill--warn" key={door.id}>{door.label}</span>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow">check an action</div>
        <p className="muted" style={{ marginTop: 6 }}>Classification writes an autonomy receipt — blocked when approval is required.</p>
        <input
          style={{ width: '100%', marginTop: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          placeholder="Describe the proposed action…"
        />
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <button type="button" className="btn" disabled={busy} onClick={evaluate}>
            {busy ? 'Evaluating…' : 'Evaluate action'}
          </button>
        </div>
        {evaluation && (
          <div className="zone receiptEvidenceRow" style={{ marginTop: 14 }}>
            <span className={`pill ${zoneClass(evaluation.zone)}`}>{evaluation.zone}</span>
            <div>
              <div className="card__title">{evaluation.requires_approval ? 'Approval required' : 'May proceed autonomously'}</div>
              <p className="muted" style={{ marginTop: 4 }}>{evaluation.reason}</p>
              {receiptId && <div className="mono receiptEvidenceRef" style={{ marginTop: 6 }}>receipt · {receiptId}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Connect Letta (live setup) ---------- */
const codePill: Record<StatusCode, [string, string]> = {
  ready: ['pill--ok', 'connected'],
  'no-api-key': ['pill--warn', 'auth needed'],
  'no-agent': ['pill--warn', 'needs agent'],
  unreachable: ['pill--warn', 'unreachable'],
  'sdk-missing': ['pill--warn', 'SDK missing'],
  stale: ['pill--warn', 'stale session'],
  error: ['pill--warn', 'not connected'],
};

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13.5,
  background: 'var(--panel)',
  color: 'var(--ink)',
  width: '100%',
  marginTop: 4,
};

const ConnectLetta: React.FC = () => {
  const api = ottoApi();
  const rt = useRuntimeContext();
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [agentId, setAgentId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.connection.get().then((c) => {
      setBaseUrl(c.baseUrl ?? '');
      setAgentId(c.agentId ?? '');
    });
    api.runtime.status().then(setStatus).catch(() => {});
  }, [api]);

  if (!api) {
    return (
      <div className="panel">
        <div className="eyebrow">connect letta</div>
        <div className="h-sec" style={{ marginTop: 6 }}>Local Letta connection</div>
        <p className="muted" style={{ marginTop: 6 }}>
          The desktop app auto-detects the local Letta runtime and current/default agent.
          This web preview cannot open the Electron bridge, so manual overrides are disabled here.
        </p>
      </div>
    );
  }

  const connect = async () => {
    setBusy(true);
    try {
      const next = await api.connection.save({
        baseUrl: baseUrl.trim() || null,
        agentId: agentId.trim() || null,
      });
      setStatus(next);
      rt.updateStatus(next);
    } finally {
      setBusy(false);
    }
  };

  const displayStatus = rt.status ?? status;
  const code: StatusCode = displayStatus?.ready ? 'ready' : displayStatus?.code ?? 'error';
  const [cls, label] = codePill[code] ?? ['pill--warn', 'not connected'];

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="eyebrow">connect letta</div>
        <span className={`pill ${cls}`}>{label}</span>
      </div>
      <div className="h-sec" style={{ marginTop: 6 }}>Local Letta connection</div>
      <p className="muted" style={{ marginTop: 4 }}>
        otto uses your local Letta runtime and current/default agent automatically. Use these fields only as advanced overrides.
      </p>
      {displayStatus && !displayStatus.ready && displayStatus.reason && (
        <p className="faint" style={{ marginTop: 6 }}>↳ {displayStatus.reason}</p>
      )}
      <div className="grid" style={{ gap: 12, marginTop: 12 }}>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Local Letta URL override</span>
          <input
            style={inputStyle}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Auto-detect local runtime"
            spellCheck={false}
          />
        </label>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Agent ID override</span>
          <input
            className="mono"
            style={inputStyle}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Auto-detect current/default agent"
            spellCheck={false}
          />
        </label>
      </div>
      <div className="row" style={{ marginTop: 14, gap: 12, alignItems: 'center' }}>
        <button className="btn btn--primary" onClick={connect} disabled={busy}>
          {busy ? 'Connecting…' : 'Save overrides & reconnect'}
        </button>
        {displayStatus?.ready && (
          <span className="muted" style={{ fontSize: 13 }}>
            {displayStatus.agentId}
            {displayStatus.model ? ` · ${displayStatus.model}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

/* ---------- Settings (Setup + Readiness) ---------- */
const readyPill = (s: ReadyStatus) => {
  const map: Record<ReadyStatus, [string, string]> = {
    connected: ['pill--ok', 'connected'],
    configured: ['pill--ok', 'configured'],
    file: ['pill', 'file-backed'],
    missing: ['pill--warn', 'missing'],
    'not-wired': ['pill', 'not wired'],
  };
  const [cls, label] = map[s];
  return <span className={`pill ${cls}`}>{label}</span>;
};

const ReadyRow: React.FC<{ item: ReadyItem }> = ({ item }) => (
  <div className="zone" style={{ gridTemplateColumns: '190px 1fr auto', gap: 16 }}>
    <span style={{ fontWeight: 600, fontSize: 14 }}>
      {item.label}
      {item.required && <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}> · required</span>}
    </span>
    <div>
      <div className="muted" style={{ fontSize: 13.5 }}>{item.detail}</div>
      {item.source && <span className="filechip" style={{ marginTop: 6 }}>{Icon.file} {item.source}</span>}
      <div className="faint mono" style={{ fontSize: 11.5, marginTop: 6 }}>↳ {item.action}</div>
    </div>
    {readyPill(item.status)}
  </div>
);

type ProviderKind = 'local' | 'cloud';
const MODEL_PROVIDERS: Array<{
  kind: ProviderKind;
  name: string;
  detail: string;
  matches: string[];
}> = [
  { kind: 'local', name: 'ChatGPT Plus/Pro (Codex Subscription)', detail: 'Subscription auth and Codex/GPT handles managed by Letta.', matches: ['chatgpt-plus-pro', 'openai-codex'] },
  { kind: 'local', name: 'Anthropic', detail: 'Claude API keys managed by Letta.', matches: ['anthropic/claude'] },
  { kind: 'local', name: 'Anthropic (Claude Pro/Max)', detail: 'Subscription auth managed by Letta.', matches: ['claude-pro-max'] },
  { kind: 'local', name: 'OpenAI', detail: 'OpenAI API keys managed by Letta.', matches: ['openai/'] },
  { kind: 'cloud', name: 'Amazon Bedrock', detail: 'AWS Bedrock credentials live in Letta.', matches: ['bedrock/', 'amazon-bedrock'] },
  { kind: 'cloud', name: 'Azure OpenAI Responses', detail: 'Azure endpoint and key live in Letta.', matches: ['azure-openai'] },
  { kind: 'cloud', name: 'Cloudflare AI Gateway', detail: 'Cloudflare gateway credentials live in Letta.', matches: ['cloudflare'] },
  { kind: 'cloud', name: 'DeepSeek', detail: 'DeepSeek API key lives in Letta.', matches: ['deepseek'] },
  { kind: 'cloud', name: 'Cerebras', detail: 'Cerebras API key lives in Letta.', matches: ['cerebras'] },
  { kind: 'cloud', name: 'Fireworks', detail: 'Fireworks API key lives in Letta.', matches: ['fireworks'] },
];

const ModelProviders: React.FC = () => {
  const api = ottoApi();
  const rt = useRuntimeContext();
  const [tab, setTab] = useState<ProviderKind>('local');
  const activeModel = `${rt.status?.modelHandle ?? ''} ${rt.status?.model ?? ''}`.toLowerCase();
  const openLetta = () => void api?.runtime.openLetta();
  const rows = MODEL_PROVIDERS.filter((p) => p.kind === tab);

  return (
    <div className="providersScreen">
      <div className="panel providersHero">
        <div>
          <div className="eyebrow">model providers</div>
          <div className="h-sec" style={{ marginTop: 6 }}>Managed in Letta, selected in otto</div>
          <p className="muted" style={{ marginTop: 6 }}>
            otto does not collect provider keys. Connect providers in Letta, then choose model and effort from the chat composer.
          </p>
        </div>
        <button className="btn btn--primary" onClick={openLetta}>Open Letta</button>
      </div>

      <div className="segmented" role="tablist" aria-label="Provider type">
        <button className={tab === 'local' ? 'is-active' : ''} onClick={() => setTab('local')}>Local</button>
        <button className={tab === 'cloud' ? 'is-active' : ''} onClick={() => setTab('cloud')}>Cloud</button>
      </div>

      <div className="providerList">
        {rows.map((provider) => {
          const active = provider.matches.some((m) => activeModel.includes(m));
          return (
            <div className="providerRow" key={provider.name}>
              <div className="providerRow__glyph">{active ? <span className="dot dot--ok" /> : Icon.lock}</div>
              <div>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <strong>{provider.name}</strong>
                  <span className={`pill ${active ? 'pill--ok' : ''}`}>{active ? 'active model' : 'managed in Letta'}</span>
                </div>
                <p className="muted" style={{ marginTop: 4 }}>{provider.detail}</p>
              </div>
              <button className="btn" onClick={openLetta}>{active ? 'Manage' : 'Connect'}</button>
            </div>
          );
        })}
      </div>

      <p className="faint mono" style={{ fontSize: 11.5 }}>
        Current model: {rt.status?.model ?? rt.status?.modelHandle ?? 'not connected'} · Provider connection status is intentionally not guessed.
      </p>
    </div>
  );
};

export const Settings: React.FC = () => {
  const rt = useRuntimeContext();
  const [section, setSection] = useState<'general' | 'providers'>('general');
  // Live runtime is the source of truth in Electron; the file-backed checklist describes local
  // config only. Never let the readiness panel say "Setup required" while the runtime is connected.
  const liveConnected = rt.electron && !!rt.status?.ready;
  const liveRows: ReadyItem[] = liveConnected ? [
    {
      key: 'runtime',
      label: 'Letta runtime',
      required: true,
      status: 'connected',
      detail: 'Live Letta session initialized',
      source: 'RuntimeStatus',
      action: 'session.initialize() returned ready',
    },
    {
      key: 'agent',
      label: 'Agent identity',
      required: true,
      status: 'configured',
      detail: rt.status?.agentId ? `agent ${rt.status.agentId}` : 'agent connected',
      source: 'RuntimeStatus',
      action: 'Resolved from the live Letta session',
    },
    {
      key: 'model',
      label: 'Model provider',
      required: false,
      status: 'connected',
      detail: rt.status?.model ?? 'owned by live Letta runtime',
      source: 'RuntimeStatus',
      action: 'Configure providers in Letta Desktop / Letta local runtime',
    },
    {
      key: 'memory',
      label: 'Memory / MemFS',
      required: true,
      status: rt.status?.memfsEnabled ? 'connected' : 'configured',
      detail: rt.status?.memfsEnabled ? 'MemFS enabled by live runtime' : 'Connected through live runtime; MemFS not enabled',
      source: 'RuntimeStatus',
      action: rt.status?.memfsEnabled ? 'Available in the initialized session' : 'Enable OTTO_MEMFS=1 only for backends that support it',
    },
    {
      key: 'functions',
      label: 'Runtime tools',
      required: false,
      status: (rt.status?.tools?.length ?? 0) > 0 ? 'configured' : 'not-wired',
      detail: `${rt.status?.tools?.length ?? 0} tool${(rt.status?.tools?.length ?? 0) === 1 ? '' : 's'} available`,
      source: 'RuntimeStatus',
      action: 'Forwarded by the initialized Letta session',
    },
  ] : [];
  const liveByKey = new Map(liveRows.map((r) => [r.key, r]));
  const ready = liveConnected || requiredMissing.length === 0;
  const group = (keys: string[]) => readiness.filter((r) => keys.includes(r.key)).map((r) => liveByKey.get(r.key) ?? r);

  return (
    <div className="settingsShell">
      <aside className="settingsNav" aria-label="Settings sections">
        <button className={section === 'general' ? 'is-active' : ''} onClick={() => setSection('general')}>
          {Icon.settings}<span>General</span>
        </button>
        <button className={section === 'providers' ? 'is-active' : ''} onClick={() => setSection('providers')}>
          {Icon.lock}<span>Model providers</span>
        </button>
      </aside>

      {section === 'providers' ? (
        <ModelProviders />
      ) : (
        <div className="grid" style={{ maxWidth: 880, gap: 16 }}>
          <ConnectLetta />
          <div className="panel" style={ready ? undefined : { borderColor: '#e7dcc0', background: 'var(--warn-tint)' }}>
            <div className="eyebrow">readiness</div>
            <div className="h-sec" style={{ marginTop: 6 }}>
              {liveConnected
                ? `Connected — ${rt.status?.agentId ?? 'agent'}${rt.status?.model ? ` · ${rt.status.model}` : ''}`
                : ready
                  ? 'otto is ready to work'
                  : 'Setup required — otto is not ready to work'}
            </div>
            {liveConnected ? (
              <p className="muted" style={{ marginTop: 6 }}>
                Live Letta runtime connected. The file-backed checks below describe local config only.
              </p>
            ) : (
              !ready && (
                <p className="muted" style={{ marginTop: 6 }}>
                  {requiredMissing.length} required {requiredMissing.length === 1 ? 'item' : 'items'} missing:{' '}
                  {requiredMissing.map((r) => r.label).join(' · ')}. Configure them below — until then, Chat is disabled.
                </p>
              )
            )}
          </div>
          <div className="panel">
            <div className="eyebrow">runtime &amp; identity</div>
            <div style={{ marginTop: 4 }}>
              {group(['runtime', 'agent', 'model', 'memory', 'workspace']).map((r) => <ReadyRow key={r.key} item={r} />)}
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">capabilities</div>
            <div style={{ marginTop: 4 }}>
              {group(['skills', 'practices', 'mcp', 'functions', 'permissions']).map((r) => <ReadyRow key={r.key} item={r} />)}
            </div>
          </div>
          <p className="faint mono" style={{ fontSize: 11.5 }}>
            v1 is local-only: otto connects to a local Letta runtime. Cloud/self-host auth can come later as an advanced path.
          </p>
        </div>
      )}
    </div>
  );
};
