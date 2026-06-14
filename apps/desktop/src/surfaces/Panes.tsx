import React, { useEffect, useMemo, useState } from 'react';
import {
  readiness,
  requiredMissing,
  type ReadyItem,
  type ReadyStatus,
} from '../readiness';
import { Icon } from '../components/icons';
import { useToast } from '../components/Toast';
import { EmptyState, StatusPill, SurfaceProof, SurfacePage, SurfaceHero, InkBlock, SurfaceInk, SurfaceStatStrip, SurfaceMeta, SplitLayout, FilterBar, InlineEmpty, WebPreviewFrame, ReceiptCard } from '../components/ui';
import {
  toastCopy,
  curationCopy,
  receiptsCopy,
  chartersCopy,
  standardsCopy,
  practicesCopy,
  routinesCopy,
  autonomyCopy,
  skillsCopy,
  knowledgeCopy,
  ticketsCopy,
  channelsCopy,
  settingsCopy,
  listEmpty,
  cultureSettingsCopy,
} from '../copy/surfaces';
import { SURFACE_TESTS } from '../canon-briefs';
import {
  isSampleReceiptPreviewEnabled,
  SAMPLE_RECEIPT_DETAIL,
  SAMPLE_RECEIPT_SUMMARY,
} from '../onboarding-sample-receipt';
import { resetOnboardingForReplay } from '../onboarding-storage';
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
  type ApprovalListResult,
  type KnowledgeListResult,
  type SkillListResult,
  type SkillRecord,
  type ChannelListResult,
  type ChannelRecord,
  type TicketListResult,
  type TicketRecord,
  type TicketReviewRecord,
  type WorkerListResult,
  type WorkerRecord,
  type RunListResult,
  type RunSummary,
} from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';
import type { SurfaceId } from '../components/Sidebar';

const EmptySurface = EmptyState;

type SkippedFile = { slug: string; file: string; reason: string };

const SkippedLoaderPanel: React.FC<{ skipped: SkippedFile[] }> = ({ skipped }) => {
  if (!skipped.length) return null;
  return (
    <details className="panel skippedPanel" open={skipped.length <= 3}>
      <summary className="between">
        <div>
          <div className="eyebrow">loader</div>
          <div className="h-sec">{skipped.length} malformed file{skipped.length === 1 ? '' : 's'} skipped</div>
        </div>
        <span className="pill pill--warn">validation</span>
      </summary>
      <div className="skippedList">
        {skipped.map((item) => (
          <div className="skippedRow" key={`${item.file}-${item.slug}`}>
            <span className="filechip">{Icon.file} {item.file}</span>
            <span className="muted">{item.reason}</span>
          </div>
        ))}
      </div>
    </details>
  );
};

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
    }).catch((e) => {
      if (!cancelled) {
        setDetail(null);
        setError(String(e));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [api, selectedSlug]);

  const createCharter = async () => {
    if (!api) return;
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
    if (!api || !detail || detail.status === statusDraft) return;
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
    if (!api || !detail || (!runId.trim() && !receiptId.trim())) return;
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

  if (!api) {
    return <WebPreviewFrame surface="charters" />;
  }

  const charters = result?.charters ?? [];
  const activeCount = charters.filter((c) => c.status === 'active').length;
  const completeCount = charters.filter((c) => c.status === 'complete').length;

  return (
    <SurfacePage className="charterSurface">
      <SurfaceHero
        eyebrow={chartersCopy.eyebrow}
        title={chartersCopy.title}
        lede={chartersCopy.lede}
        proof={SURFACE_TESTS.charters}
      />
      <SurfaceInk lead={chartersCopy.inkLead} muted={chartersCopy.inkMuted} sub={chartersCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: chartersCopy.statTotal, value: charters.length },
          { label: chartersCopy.statActive, value: activeCount, tone: activeCount ? 'ok' : 'neutral' },
          { label: chartersCopy.statComplete, value: completeCount },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      <SplitLayout
        list={
          <>
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
            {result === null ? (
              <div className="panel charterEmptyList">
                <p className="muted">Loading charters…</p>
              </div>
            ) : !charters.length ? (
              <InlineEmpty title={listEmpty.charters?.title ?? 'No charters yet'} body={listEmpty.charters?.body ?? ''} />
            ) : null}
          </>
        }
        detail={
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
        }
      />

      <SurfaceMeta label={chartersCopy.metaLabel}>
        <div className="charterCreate">
          <div>
            <div className="eyebrow">{chartersCopy.createEyebrow}</div>
            <div className="h-sec" style={{ marginTop: 6 }}>{chartersCopy.createTitle}</div>
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
        <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/charters'}</span>
      </SurfaceMeta>
      <SurfaceProof surface="charters" />
    </SurfacePage>
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
          {statusDraft === 'complete' && detail.acceptance_criteria.some((ac) => !ac.receipts.length) && (
            <p className="muted" style={{ marginTop: 8 }}>
              Complete requires receipt proof on every acceptance criterion ({detail.acceptance_criteria.filter((ac) => !ac.receipts.length).map((ac) => ac.id).join(', ')} missing).
            </p>
          )}
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
    return <WebPreviewFrame surface="standards" />;
  }

  const standards = result?.standards ?? [];
  const selected = standards.find((standard) => standard.slug === selectedSlug) ?? standards[0] ?? null;
  const activeCount = standards.filter((s) => s.status === 'active').length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={standardsCopy.eyebrow}
        title={standardsCopy.title}
        lede={standardsCopy.lede}
        proof={SURFACE_TESTS.standards}
      />
      <SurfaceInk lead={standardsCopy.inkLead} muted={standardsCopy.inkMuted} sub={standardsCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: standardsCopy.statLoaded, value: standards.length },
          { label: standardsCopy.statActive, value: activeCount, tone: activeCount ? 'ok' : 'neutral' },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      <SkippedLoaderPanel skipped={result?.skipped ?? []} />
      <SplitLayout
        list={
          <>
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
            {result === null ? (
              <div className="panel">
                <p className="muted">Loading standards…</p>
              </div>
            ) : !standards.length ? (
              <InlineEmpty title={listEmpty.standards?.title ?? 'No Standards loaded'} body={listEmpty.standards?.body ?? ''} />
            ) : null}
          </>
        }
        detail={selected ? <StandardDetail standard={selected} /> : null}
      />
      {result && (
        <SurfaceMeta label={standardsCopy.metaLabel}>
          <span className="filechip">{Icon.file} {result.registryPath ?? 'standards/registry.yaml'}</span>
          <div className="zone" style={{ marginTop: 12 }}>
            <span className="zone__tag">ratification</span>
            <span>
              {result.registry.ratification.owner} owns changes · auto apply {String(result.registry.ratification.auto_apply ?? false)}
            </span>
          </div>
        </SurfaceMeta>
      )}
      <SurfaceProof surface="standards" />
    </SurfacePage>
  );
};

const StandardDetail: React.FC<{ standard: StandardRecord }> = ({ standard }) => {
  const api = ottoApi();
  const [conflict, setConflict] = useState<import('../runtime').StandardConflictResult | null>(null);

  useEffect(() => {
    if (!api?.standards.conflictForStandard) return;
    let cancelled = false;
    api.standards.conflictForStandard(standard.slug)
      .then((next) => { if (!cancelled) setConflict(next); })
      .catch(() => { if (!cancelled) setConflict(null); });
    return () => { cancelled = true; };
  }, [api, standard.slug]);

  return (
  <div className="detail">
    {conflict && (
      <div className="panel" style={{ borderColor: 'var(--warn)', background: 'var(--warn-tint)' }}>
        <div className="eyebrow">conflict · case law</div>
        <div className="h-sec" style={{ marginTop: 6 }}>
          {conflict.between.length > 1 ? conflict.between.join(' vs ') : conflict.between[0]}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>{conflict.message}</p>
        {conflict.tie_breaker && <p style={{ marginTop: 8 }}><strong>Tie-breaker:</strong> {conflict.tie_breaker}</p>}
        {conflict.precedent?.excerpt && (
          <pre className="mono" style={{ marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 12 }}>{conflict.precedent.excerpt}</pre>
        )}
        {conflict.precedent?.file && (
          <span className="filechip" style={{ marginTop: 10 }}>{conflict.precedent.file}</span>
        )}
        {!conflict.precedent && (
          <p className="muted" style={{ marginTop: 8 }}>Propose a Curation Standards change instead of improvising in chat.</p>
        )}
      </div>
    )}
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
};

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
    return <WebPreviewFrame surface="practices" />;
  }

  const practices = result?.practices ?? [];
  const selected = practices.find((practice) => practice.slug === selectedSlug) ?? practices[0] ?? null;
  const relatedReceipts = selected
    ? receipts.filter((receipt) => receipt.practiceSlug === selected.slug).slice(0, 8)
    : [];
  const withProofCount = practices.filter((p) =>
    receipts.some((r) => r.practiceSlug === p.slug),
  ).length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={practicesCopy.eyebrow}
        title={practicesCopy.title}
        lede={practicesCopy.lede}
        proof={SURFACE_TESTS.practices}
      />
      <SurfaceInk lead={practicesCopy.inkLead} muted={practicesCopy.inkMuted} sub={practicesCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: practicesCopy.statLoaded, value: practices.length },
          { label: practicesCopy.statWithReceipts, value: withProofCount },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      <SkippedLoaderPanel skipped={result?.skipped ?? []} />
      <SplitLayout
        list={
          <>
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
            {result === null ? (
              <div className="panel">
                <p className="muted">Loading practices…</p>
              </div>
            ) : !practices.length ? (
              <InlineEmpty title={listEmpty.practices?.title ?? 'No practices loaded'} body={listEmpty.practices?.body ?? ''} />
            ) : null}
          </>
        }
        detail={selected ? <PracticeDetail practice={selected} relatedReceipts={relatedReceipts} /> : null}
      />
      <SurfaceMeta label={practicesCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.dir ?? 'practices/'}</span>
        <div className="zone" style={{ marginTop: 12 }}>
          <span className="zone__tag">curation gate</span>
          <span>{practicesCopy.curationGate}</span>
        </div>
      </SurfaceMeta>
      <SurfaceProof surface="practices" />
    </SurfacePage>
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

  const runManual = async () => {
    if (!api || !selectedSlug || busy) return;
    setBusy(true);
    setRunMessage(null);
    setError(null);
    try {
      const run = await api.routines.runManual(selectedSlug);
      setRunMessage(`Manual run recorded: ${run.receipt.id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!api) {
    return <WebPreviewFrame surface="routines" />;
  }

  const routines = result?.routines ?? [];
  const selected = routines.find((routine) => routine.slug === selectedSlug) ?? routines[0] ?? null;
  const activeCount = routines.filter((r) => r.status === 'active').length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={routinesCopy.eyebrow}
        title={routinesCopy.title}
        lede={routinesCopy.lede}
        proof={SURFACE_TESTS.routines}
      />
      <SurfaceInk lead={routinesCopy.inkLead} muted={routinesCopy.inkMuted} sub={routinesCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: routinesCopy.statLoaded, value: routines.length },
          { label: routinesCopy.statActive, value: activeCount, tone: activeCount ? 'ok' : 'neutral' },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {runMessage && <div className="notice"><span className="dot dot--ok" /> {runMessage}</div>}
      <SkippedLoaderPanel skipped={result?.skipped ?? []} />
      <SplitLayout
        list={
          <>
            {result === null ? (
              <div className="panel">
                <p className="muted">Loading routines…</p>
              </div>
            ) : routines.map((routine) => (
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
            {result && !routines.length && (
              <InlineEmpty title={listEmpty.routines?.title ?? 'No routines loaded'} body={listEmpty.routines?.body ?? ''} />
            )}
          </>
        }
        detail={selected ? (
          <RoutineDetail routine={selected} gate={gate} busy={busy} onRunManual={runManual} />
        ) : null}
      />
      <SurfaceMeta label={routinesCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.dir ?? 'routines/'}</span>
      </SurfaceMeta>
      <SurfaceProof surface="routines" />
    </SurfacePage>
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
type CurationMainPanel = 'inbox' | 'changelog';

const PENDING_STATUSES = new Set(['proposed', 'needs_approval']);
const isPendingProposal = (status: string) => PENDING_STATUSES.has(status);
const canDecideProposal = (status: string) => status === 'proposed' || status === 'needs_approval';
const isMemoryWritebackProposal = (kind: string) => kind === 'memory_writeback';

export const Curation: React.FC<{ initialPanel?: CurationMainPanel }> = ({ initialPanel = 'inbox' }) => {
  const api = ottoApi();
  const { push: pushToast } = useToast();
  const [result, setResult] = useState<ProposalListResult | null>(null);
  const [approvals, setApprovals] = useState<ApprovalListResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProposalInboxFilter>('pending');
  const [mainPanel, setMainPanel] = useState<CurationMainPanel>(initialPanel);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    if (!api) return Promise.resolve();
    return Promise.all([
      api.curation.proposals.list().then((next) => setResult(next)),
      api.curation.approvals.list().then((next) => setApprovals(next)),
    ]).catch((e) => setError(String(e)));
  };

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    Promise.all([
      api.curation.proposals.list(),
      api.curation.approvals.list(),
    ])
      .then(([proposals, approvalList]) => {
        if (cancelled) return;
        setResult(proposals);
        setApprovals(approvalList);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    setMainPanel(initialPanel);
  }, [initialPanel]);

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
    return <WebPreviewFrame surface="curation" />;
  }

  const pendingCount = proposals.filter((p) => isPendingProposal(p.status)).length;
  const decidedCount = proposals.length - pendingCount;

  const decide = async (decision: 'accept' | 'reject' | 'defer') => {
    if (!api || !selected || busy || !canDecideProposal(selected.status)) return;
    setBusy(true);
    setError(null);
    try {
      const outcome = await api.curation.proposals.decide(selected.id, { decision });
      if (outcome.blocked) {
        const blockedMessage = outcome.receipt.blocker?.message ?? 'Decision blocked';
        setError(blockedMessage);
        pushToast({ title: toastCopy.decisionBlocked, body: blockedMessage, tone: 'warn' });
      } else if (decision === 'accept') {
        const canonApplied = outcome.receipt.result?.data?.canonApplied === true;
        const targetLabel = selected.target?.kind ?? 'canon';
        const behaviorChanged = canonApplied || outcome.proposal.status === 'applied';
        if (behaviorChanged) {
          pushToast({
            title: isMemoryWritebackProposal(selected.kind)
              ? toastCopy.behaviorUpdatedMemory
              : toastCopy.behaviorUpdated,
            body: `${targetLabel}: ${selected.summary} · receipt ${outcome.receipt.id}`,
            tone: 'ok',
          });
        } else {
          pushToast({
            title: toastCopy.proposalAccepted,
            body: `receipt ${outcome.receipt.id}`,
            tone: 'ok',
          });
        }
      } else if (decision === 'reject') {
        pushToast({
          title: toastCopy.proposalRejected,
          body: `receipt ${outcome.receipt.id}`,
          tone: 'info',
        });
      } else {
        pushToast({
          title: toastCopy.proposalDeferred,
          body: `receipt ${outcome.receipt.id}`,
          tone: 'info',
        });
      }
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={curationCopy.eyebrow}
        title={curationCopy.title}
        lede={curationCopy.lede}
        proof={SURFACE_TESTS.curation}
      />

      <InkBlock
        headline={
          <>
            {curationCopy.inkHeadline}{' '}
            <span className="inkBlock__muted">{curationCopy.inkHeadlineMuted}</span>
          </>
        }
        sub={curationCopy.inkSub}
      />

      <SurfaceStatStrip
        stats={[
          { label: curationCopy.statPending, value: pendingCount, tone: pendingCount > 0 ? 'warn' : 'neutral' },
          { label: curationCopy.statDecided, value: decidedCount, tone: 'ok' },
        ]}
      />

      <div className="panel" style={{ marginTop: 16 }}>
        <FilterBar
          options={[
            { key: 'inbox', label: 'Inbox' },
            { key: 'changelog', label: curationCopy.changelogTitle },
          ]}
          active={mainPanel}
          onSelect={(key) => setMainPanel(key as CurationMainPanel)}
        />
        {mainPanel === 'inbox' ? (
          <FilterBar
            options={[
              { key: 'pending', label: curationCopy.filterPending },
              { key: 'decided', label: curationCopy.filterDecided },
              { key: 'all', label: curationCopy.filterAll },
            ]}
            active={filter}
            onSelect={(key) => setFilter(key as ProposalInboxFilter)}
          />
        ) : null}
      </div>

      {mainPanel === 'changelog' ? (
        <BehaviorChangelogPanel />
      ) : (
        <>
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      {filtered.length === 0 ? (
        <InlineEmpty
          title={
            filter === 'pending'
              ? curationCopy.emptyPendingTitle
              : filter === 'decided'
                ? curationCopy.emptyDecidedTitle
                : (listEmpty.curation?.title ?? curationCopy.emptyPendingTitle)
          }
          body={
            filter === 'pending'
              ? curationCopy.emptyPendingBody
              : filter === 'decided'
                ? curationCopy.emptyDecidedBody
                : (listEmpty.curation?.body ?? curationCopy.emptyPendingBody)
          }
        />
      ) : (
        <SplitLayout
          list={filtered.map((proposal) => (
            <button
              key={proposal.id}
              type="button"
              className={`card${proposal.id === selected?.id ? ' is-selected' : ''}`}
              onClick={() => setSelectedId(proposal.id)}
            >
              <div className="between">
                <span className="card__title">{proposal.summary}</span>
                <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                  {isMemoryWritebackProposal(proposal.kind) ? (
                    <span className="pill pill--info">{curationCopy.memoryBadge}</span>
                  ) : null}
                  {statusPill(proposal.status)}
                </div>
              </div>
              <span className="card__sub">{proposal.kind} · {proposal.classification.required_gate}</span>
            </button>
          ))}
          detail={selected ? (
            <ProposalDetail
              proposal={selected}
              busy={busy}
              canDecide={canDecideProposal(selected.status)}
              onAccept={() => decide('accept')}
              onReject={() => decide('reject')}
              onDefer={() => decide('defer')}
            />
          ) : null}
        />
      )}

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="between">
          <div>
            <div className="eyebrow">{curationCopy.approvalsEyebrow}</div>
            <div className="h-sec">{curationCopy.approvalsTitle}</div>
          </div>
          <span className="pill pill--info">emitted by curation</span>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>{curationCopy.approvalsLede}</p>
        {(approvals?.approvals ?? []).length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>{curationCopy.approvalsEmpty}</p>
        ) : (
          <div className="receiptEvidence" style={{ marginTop: 12 }}>
            {(approvals?.approvals ?? []).slice(0, 12).map((approval) => (
              <div className="zone receiptEvidenceRow" key={approval.id}>
                <span className="zone__tag">{approval.status}</span>
                <div>
                  <div className="card__title">{approval.scope}</div>
                  <div className="mono receiptEvidenceRef" style={{ marginTop: 4 }}>
                    {approval.proposal_id} · {approval.receipt_id}
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {approval.requirement} · {formatReceiptTime(approval.decided_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SurfaceMeta label={curationCopy.metaStorage}>
        <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/curation/proposals/'}</span>
      </SurfaceMeta>
        </>
      )}
      <SurfaceProof surface="curation" />
    </SurfacePage>
  );
};

const BehaviorChangelogPanel: React.FC = () => {
  const api = ottoApi();
  const [entries, setEntries] = useState<import('@otto-haus/core').BehaviorChangelogEntry[]>([]);
  const [emptyMessage, setEmptyMessage] = useState('No behavior changes this week.');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    setLoading(true);
    api.changelog.list(7)
      .then((result) => {
        if (cancelled) return;
        setEntries(result.entries);
        setEmptyMessage(result.empty_message);
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

  if (!api) return null;

  return (
    <div className="panel" style={{ marginTop: 8 }}>
      <div className="eyebrow">{curationCopy.changelogEyebrow}</div>
      <div className="h-sec" style={{ marginTop: 6 }}>{curationCopy.changelogTitle}</div>
      <p className="muted" style={{ marginTop: 6 }}>{curationCopy.changelogLede}</p>
      {error ? <div className="notice" style={{ marginTop: 12 }}><span className="dot dot--warn" /> {error}</div> : null}
      {loading ? (
        <p className="muted" style={{ marginTop: 12 }}>Loading changelog…</p>
      ) : entries.length === 0 ? (
        <InlineEmpty title={emptyMessage} body="Ratify a proposal or amend the constitution to see culture changes here." />
      ) : (
        <div className="receiptEvidence" style={{ marginTop: 12 }}>
          {entries.map((entry) => (
            <div className="zone receiptEvidenceRow" key={`${entry.receipt_id}-${entry.timestamp}`}>
              <span className="zone__tag">{entry.source}</span>
              <div>
                <div className="card__title">{entry.what}</div>
                <p className="muted" style={{ marginTop: 4 }}>{entry.why}</p>
                <div className="mono receiptEvidenceRef" style={{ marginTop: 6 }}>
                  {entry.authority} · receipt {entry.receipt_id} · {formatReceiptTime(entry.timestamp)}
                </div>
              </div>
            </div>
          ))}
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
      <div className="panel ratificationPanel">
        <div className="eyebrow">{curationCopy.ratificationTitle}</div>
        <p className="lede" style={{ marginTop: 8 }}>{curationCopy.ratificationLede}</p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onAccept}>{curationCopy.accept}</button>
          <button type="button" className="btn" disabled={busy} onClick={onReject}>{curationCopy.reject}</button>
          <button type="button" className="btn" disabled={busy} onClick={onDefer}>{curationCopy.defer}</button>
        </div>
      </div>
    )}
    <SurfaceMeta label={curationCopy.metaStorage}>
      <span className="filechip">{proposal.id}</span>
      <span className="filechip">{proposal.path}</span>
    </SurfaceMeta>
  </div>
);

/* ---------- Receipts (runs + proof) ---------- */
const RECEIPT_FILTERS: Array<'all' | ReceiptStatus> = ['all', 'success', 'blocked', 'failed'];

export const Receipts: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<ReceiptListResult | null>(null);
  const [runsResult, setRunsResult] = useState<RunListResult | null>(null);
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
    Promise.all([api.receipts.list(), api.runs.list()])
      .then(([next, runList]) => {
        if (cancelled) return;
        setResult(next);
        setRunsResult(runList);
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
  const runs = runsResult?.runs ?? [];
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
  const statusCounts = useMemo(() => ({
    success: receipts.filter((r) => r.status === 'success').length,
    blocked: receipts.filter((r) => r.status === 'blocked').length,
    failed: receipts.filter((r) => r.status === 'failed').length,
  }), [receipts]);

  if (!api) {
    return <WebPreviewFrame surface="receipts" />;
  }

  if (!loading && !receipts.length) {
    if (isSampleReceiptPreviewEnabled()) {
      return (
        <SurfacePage className="receiptsSurface">
          <SurfaceHero
            eyebrow={receiptsCopy.sampleEyebrow}
            title={receiptsCopy.sampleTitle}
            lede={receiptsCopy.sampleBody}
            proof={SURFACE_TESTS.receipts}
          />
          <SplitLayout
            list={
              <ReceiptCard
                receipt={{
                  id: SAMPLE_RECEIPT_SUMMARY.id,
                  action: SAMPLE_RECEIPT_SUMMARY.action,
                  status: SAMPLE_RECEIPT_SUMMARY.status,
                  summary: SAMPLE_RECEIPT_SUMMARY.summary,
                  metaLine: 'sample · chat:onboarding-sample',
                }}
                selected
                onSelect={() => undefined}
              />
            }
            detail={<ReceiptDetailView detail={SAMPLE_RECEIPT_DETAIL} summary={SAMPLE_RECEIPT_SUMMARY} />}
          />
          <SurfaceProof surface="receipts" />
        </SurfacePage>
      );
    }

    return (
      <SurfacePage className="receiptsSurface">
        <SurfaceHero
          eyebrow={receiptsCopy.eyebrow}
          title={receiptsCopy.emptyTitle}
          lede={receiptsCopy.emptyBody}
          proof={SURFACE_TESTS.receipts}
        />
        {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
        {runs.length > 0 && (
          <div className="panel">
            <div className="between">
              <div>
                <div className="eyebrow">{receiptsCopy.runsEyebrow}</div>
                <div className="h-sec">{receiptsCopy.runsTitle}</div>
              </div>
            </div>
            <div className="receiptEvidence" style={{ marginTop: 12 }}>
              {runs.slice(0, 8).map((run) => (
                <div className="zone receiptEvidenceRow" key={run.id}>
                  <span className="zone__tag">{run.status}</span>
                  <div>
                    <div className="card__title">{run.summary ?? run.practice}</div>
                    <div className="mono receiptEvidenceRef" style={{ marginTop: 4 }}>{run.id} · {run.practice}</div>
                  </div>
                </div>
              ))}
            </div>
            <SurfaceMeta label={receiptsCopy.recordMeta}>
              <span className="filechip">{Icon.file} {runsResult?.dir ?? '~/.otto/runs'}</span>
            </SurfaceMeta>
          </div>
        )}
        <SurfaceMeta label={receiptsCopy.recordMeta}>
          <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/receipts'}</span>
        </SurfaceMeta>
        <SurfaceProof surface="receipts" />
      </SurfacePage>
    );
  }

  return (
    <SurfacePage className="receiptsSurface">
      <SurfaceHero
        eyebrow={receiptsCopy.eyebrow}
        title={receiptsCopy.title}
        lede={loading ? receiptsCopy.loadingTitle : receiptsCopy.lede}
        proof={SURFACE_TESTS.receipts}
      />

      <SurfaceStatStrip
        stats={[
          { label: receiptsCopy.statTotal, value: receipts.length },
          { label: receiptsCopy.statSuccess, value: statusCounts.success, tone: 'ok' },
          { label: receiptsCopy.statBlocked, value: statusCounts.blocked, tone: statusCounts.blocked > 0 ? 'warn' : 'neutral' },
          { label: receiptsCopy.statFailed, value: statusCounts.failed, tone: statusCounts.failed > 0 ? 'warn' : 'neutral' },
        ]}
      />

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="receiptControls">
          <input
            className="receiptSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={receiptsCopy.searchPlaceholder}
            aria-label={receiptsCopy.searchPlaceholder}
          />
          <FilterBar
            options={RECEIPT_FILTERS.map((item) => ({
              key: item,
              label: item === 'all' ? receiptsCopy.filterAll : item,
            }))}
            active={filter}
            onSelect={(key) => setFilter(key as typeof filter)}
          />
        </div>
      </div>

      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}

      {runs.length > 0 && (
        <div className="panel">
          <div className="between">
            <div>
              <div className="eyebrow">{receiptsCopy.runsEyebrow}</div>
              <div className="h-sec">{receiptsCopy.runsTitle}</div>
            </div>
          </div>
          <div className="receiptEvidence" style={{ marginTop: 12 }}>
            {runs.slice(0, 8).map((run) => (
              <div className="zone receiptEvidenceRow" key={run.id}>
                <span className="zone__tag">{run.status}</span>
                <div>
                  <div className="card__title">{run.summary ?? run.practice}</div>
                  <div className="mono receiptEvidenceRef" style={{ marginTop: 4 }}>{run.id} · {run.practice}</div>
                </div>
              </div>
            ))}
          </div>
          <SurfaceMeta label={receiptsCopy.recordMeta}>
            <span className="filechip">{Icon.file} {runsResult?.dir ?? '~/.otto/runs'}</span>
          </SurfaceMeta>
        </div>
      )}

      <SplitLayout
        list={
          <>
            {filtered.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={{
                  id: receipt.id,
                  action: receipt.action,
                  status: receipt.status,
                  summary: receipt.summary,
                  metaLine: `${formatReceiptTime(receipt.timestamp)} · ${receipt.subjectType}${receipt.subjectId ? `:${receipt.subjectId}` : ''}`,
                  blockerCode: receipt.blockerCode,
                }}
                selected={receipt.id === selectedId}
                onSelect={() => setSelectedId(receipt.id)}
              />
            ))}
            {!filtered.length && receipts.length > 0 && (
              <InlineEmpty title={receiptsCopy.noMatchTitle} body={receiptsCopy.noMatchBody} />
            )}
          </>
        }
        detail={<ReceiptDetailView detail={detail} summary={selectedSummary} />}
      />

      <SurfaceMeta label={receiptsCopy.recordMeta}>
        <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/receipts'}</span>
        {result?.skipped ? (
          <span className="filechip">{result.skipped} malformed skipped</span>
        ) : null}
      </SurfaceMeta>

      <SurfaceProof surface="receipts" />
    </SurfacePage>
  );
};

const ReceiptDetailView: React.FC<{ detail: ReceiptDetail | null; summary: ReceiptListResult['receipts'][number] | null }> = ({ detail, summary }) => {
  if (!summary) {
    return (
      <div className="detail">
        <div className="panel">
          <InlineEmpty title={receiptsCopy.selectTitle} body={receiptsCopy.selectBody} />
        </div>
      </div>
    );
  }

  if (!detail || detail.id !== summary.id) {
    return (
      <div className="detail">
        <div className="panel">
          <div className="h-sec">{receiptsCopy.loadingTitle}</div>
          <p className="muted" style={{ marginTop: 6 }}>{summary.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail receiptDetail">
      <div className="panel receiptDetail__authority">
        <div className="between">
          <div className="eyebrow">{receiptsCopy.authorityEyebrow}</div>
          {statusPill(detail.status)}
        </div>
        <div className="h-sec" style={{ marginTop: 8 }}>{detail.result.summary}</div>
        <p className="receiptDetail__authorityLine">
          Authority · <strong>{receiptAuthorityFromDetail(detail)}</strong>
        </p>
        <dl className="kv receiptKv" style={{ marginTop: 12 }}>
          <div><dt>action</dt><dd>{detail.action}</dd></div>
          <div><dt>when</dt><dd>{formatReceiptTime(detail.timestamp)}</dd></div>
          <div><dt>subject</dt><dd>{detail.subject.type}{detail.subject.id ? `:${detail.subject.id}` : ''}</dd></div>
          <div><dt>id</dt><dd className="mono">{detail.id}</dd></div>
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

      {detail.evidence.length > 0 ? (
        <div className="panel">
          <div className="eyebrow">{receiptsCopy.evidenceEyebrow}</div>
          <div className="receiptEvidence" style={{ marginTop: 12 }}>
            {detail.evidence.map((entry, index) => (
              <div className="zone receiptEvidenceRow" key={`${entry.kind}-${entry.ref}-${index}`}>
                <span className="zone__tag">{entry.kind === 'log' ? 'record' : entry.kind}</span>
                <div>
                  <div className="mono receiptEvidenceRef">{entry.ref}</div>
                  {entry.note && <p className="muted" style={{ marginTop: 4 }}>{entry.note}</p>}
                  {!!entry.proves?.length && (
                    <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {entry.proves.map((proof) => <span className="filechip" key={proof}>{proof}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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

      <SurfaceMeta label={receiptsCopy.debugMeta}>
        <span className="filechip">{detail.schema}</span>
        <span className="filechip">{detail.path}</span>
        <JsonPanel title="input" value={detail.input} compact />
        <JsonPanel title="result" value={detail.result} compact />
      </SurfaceMeta>
    </div>
  );
};

const JsonPanel: React.FC<{ title: string; value: unknown; compact?: boolean }> = ({ title, value, compact }) => (
  compact ? (
    <details className="surfaceMeta" style={{ flex: '1 1 100%', marginTop: 0 }}>
      <summary>{title}</summary>
      <div className="surfaceMeta__body">
        <pre className="receiptJson mono">{pretty(value)}</pre>
      </div>
    </details>
  ) : (
    <div className="panel">
      <div className="eyebrow">{title}</div>
      <pre className="receiptJson mono">{pretty(value)}</pre>
    </div>
  )
);

function receiptAuthorityFromDetail(detail: ReceiptDetail): string {
  const data = detail.result?.data;
  if (data && typeof data.authority === 'string') return data.authority;
  if (detail.subject.type === 'proposal' || detail.action.startsWith('curation.')) return 'human (curation)';
  if (detail.action.startsWith('autonomy:') || detail.action.startsWith('autonomy.')) return 'autonomy policy';
  if (detail.action.startsWith('permission:')) return 'human (permission gate)';
  if (detail.action.startsWith('constitution.')) return 'human (constitution)';
  return 'otto runtime';
}

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
  const [knowledge, setKnowledge] = useState<KnowledgeListResult | null>(null);
  const [actionText, setActionText] = useState('run tests in worktree');
  const [evaluation, setEvaluation] = useState<AutonomyActionEvaluation | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    Promise.all([api.autonomy.policy(), api.knowledge.list()])
      .then(([policy, knowledgeList]) => {
        if (!cancelled) {
          setLoaded(policy);
          setKnowledge(knowledgeList);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

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

  if (!api) {
    return <WebPreviewFrame surface="autonomy" />;
  }

  const policy = loaded?.policy;
  const zoneCount = policy?.zones.length ?? 0;
  const doorCount = policy?.doors.length ?? 0;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={autonomyCopy.eyebrow}
        title={autonomyCopy.title}
        lede={policy?.summary ?? autonomyCopy.lede}
        proof={SURFACE_TESTS.autonomy}
      />
      <SurfaceInk lead={autonomyCopy.inkLead} muted={autonomyCopy.inkMuted} sub={autonomyCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: autonomyCopy.statZones, value: zoneCount },
          { label: autonomyCopy.statDoors, value: doorCount, tone: doorCount ? 'warn' : 'neutral' },
        ]}
      />
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

      {knowledge?.registry && (
        <div className="panel">
          <div className="between">
            <div>
              <div className="eyebrow">knowledge-informed routing</div>
              <div className="h-sec">Model assignments</div>
            </div>
            <span className={`pill ${knowledge.registry.routing.status === 'active' ? 'pill--ok' : 'pill--info'}`}>
              {knowledge.registry.routing.status}
            </span>
          </div>
          <div className="receiptEvidence" style={{ marginTop: 12 }}>
            {Object.entries(knowledge.registry.routing.assignments).map(([role, handle]) => (
              <div className="zone receiptEvidenceRow" key={role}>
                <span className="zone__tag">{role}</span>
                <div className="mono">{handle}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SurfaceMeta label={autonomyCopy.metaLabel}>
        <span className="filechip">{Icon.file} {loaded?.policyPath ?? 'autonomy/policy.yaml'}</span>
        <span className="filechip">safe_auto_merge: {policy?.settings.safe_auto_merge ?? '…'}</span>
        <div style={{ marginTop: 16 }}>
          <div className="eyebrow">{autonomyCopy.evaluateEyebrow}</div>
          <p className="muted" style={{ marginTop: 6 }}>{autonomyCopy.evaluateHint}</p>
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
                {evaluation.knowledge_routing && (
                  <p className="muted" style={{ marginTop: 6 }}>
                    Knowledge routing · {evaluation.knowledge_routing.role} → {evaluation.knowledge_routing.provider}/{evaluation.knowledge_routing.model} ({evaluation.knowledge_routing.status})
                  </p>
                )}
                {receiptId && <div className="mono receiptEvidenceRef" style={{ marginTop: 6 }}>receipt · {receiptId}</div>}
              </div>
            </div>
          )}
        </div>
      </SurfaceMeta>
      <SurfaceProof surface="autonomy" />
    </SurfacePage>
  );
};

/* ---------- Skills ---------- */
export const Skills: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<SkillListResult | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.skills.list()
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setSelectedSlug(next.skills[0]?.slug ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => { cancelled = true; };
  }, [api]);

  if (!api) {
    return <WebPreviewFrame surface="skills" />;
  }

  const skills = result?.skills ?? [];
  const selected = skills.find((skill) => skill.slug === selectedSlug) ?? skills[0] ?? null;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={skillsCopy.eyebrow}
        title={skillsCopy.title}
        lede={skillsCopy.lede}
        proof={SURFACE_TESTS.skills}
      />
      <SurfaceInk lead={skillsCopy.inkLead} muted={skillsCopy.inkMuted} sub={skillsCopy.inkSub} />
      <SurfaceStatStrip stats={[{ label: skillsCopy.statLoaded, value: skills.length }]} />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      <SkippedLoaderPanel skipped={result?.skipped ?? []} />
      {!result && !error && (
        <div className="panel">
          <div className="h-sec">Loading skills…</div>
        </div>
      )}
      {result && !skills.length && !error && (
        <InlineEmpty title={listEmpty.skills?.title ?? 'No skills loaded'} body={listEmpty.skills?.body ?? ''} />
      )}
      {skills.length > 0 && (
        <SplitLayout
          list={skills.map((skill) => (
            <button
              key={skill.slug}
              className={`card${skill.slug === selected?.slug ? ' is-selected' : ''}`}
              onClick={() => setSelectedSlug(skill.slug)}
            >
              <div className="card__title">{skill.name}</div>
              <span className="card__sub">{skill.slug}</span>
            </button>
          ))}
          detail={selected ? (
            <div className="detail">
              <div className="panel">
                <div className="h-sec">{selected.name}</div>
                <p className="lede" style={{ marginTop: 8 }}>{selected.description}</p>
                <ChipList values={selected.triggers} empty="No triggers parsed" />
              </div>
            </div>
          ) : null}
        />
      )}
      <SurfaceMeta label={skillsCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.dir ?? 'skill/'}</span>
        {selected && <span className="filechip">{selected.file}</span>}
      </SurfaceMeta>
      <SurfaceProof surface="skills" />
    </SurfacePage>
  );
};

/* ---------- Knowledge ---------- */
export const Knowledge: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<KnowledgeListResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.knowledge.list()
      .then((next) => { if (!cancelled) setResult(next); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [api]);

  if (!api) {
    return <WebPreviewFrame surface="knowledge" />;
  }

  const registry = result?.registry;
  const roleCount = registry ? Object.keys(registry.routing.assignments).length : 0;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={knowledgeCopy.eyebrow}
        title={knowledgeCopy.title}
        lede={knowledgeCopy.lede}
        proof={SURFACE_TESTS.knowledge}
      />
      <SurfaceInk lead={knowledgeCopy.inkLead} muted={knowledgeCopy.inkMuted} sub={knowledgeCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: knowledgeCopy.statModels, value: registry?.models.length ?? 0 },
          { label: knowledgeCopy.statRoles, value: roleCount },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {result && !registry && !error && (
        <InlineEmpty title="Registry not found" body={`Could not read ${result.registryPath}. Knowledge routing falls back until the registry exists.`} />
      )}
      {!result && !error && (
        <div className="panel">
          <div className="h-sec">Loading knowledge…</div>
        </div>
      )}
      {registry && (
        <>
          {registry.status === 'proposed' && (
            <div className="notice">
              <span className="dot dot--warn" />
              Registry status is proposed — routing assignments are defaults, not ratified policy.
              {registry.last_reviewed ? ` Last reviewed ${registry.last_reviewed}.` : ''}
            </div>
          )}
          <div className="panel">
            <div className="between">
              <div className="eyebrow">routing assignments</div>
              {statusPill(registry.status)}
            </div>
            <div className="receiptEvidence" style={{ marginTop: 12 }}>
              {Object.entries(registry.routing.assignments).map(([role, handle]) => (
                <div className="zone receiptEvidenceRow" key={role}>
                  <span className="zone__tag">{role}</span>
                  <div className="mono">{handle}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">models</div>
            <div className="cards" style={{ marginTop: 12 }}>
              {registry.models.map((model) => (
                <div className="card" key={`${model.provider}/${model.model}`}>
                  <div className="between">
                    <span className="card__title">{model.provider}/{model.model}</span>
                    <span className="pill">{model.cost_tier ?? 'unknown'}</span>
                  </div>
                  <span className="card__sub">{model.default_roles.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <SurfaceMeta label={knowledgeCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.registryPath ?? 'knowledge/ai-frontier/model-registry.yaml'}</span>
      </SurfaceMeta>
      <SurfaceProof surface="knowledge" />
    </SurfacePage>
  );
};

/* ---------- Tickets + workers ---------- */
export const Tickets: React.FC = () => {
  const api = ottoApi();
  const [tickets, setTickets] = useState<TicketListResult | null>(null);
  const [workers, setWorkers] = useState<WorkerListResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [objective, setObjective] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!api) return;
    const [ticketList, workerList] = await Promise.all([api.tickets.list(), api.workers.list()]);
    setTickets(ticketList);
    setWorkers(workerList);
    setSelectedId((current) =>
      current && ticketList.tickets.some((t) => t.ticket_id === current)
        ? current
        : ticketList.tickets[0]?.ticket_id ?? null,
    );
  };

  useEffect(() => {
    if (!api) return;
    reload().catch((e) => setError(String(e)));
  }, [api]);

  if (!api) {
    return <WebPreviewFrame surface="tickets" />;
  }

  const list = tickets?.tickets ?? [];
  const selected = list.find((t) => t.ticket_id === selectedId) ?? list[0] ?? null;
  const workerForTicket = workers?.workers.find((w) => w.ticket_id === selected?.ticket_id) ?? null;

  const compile = async () => {
    if (!api || busy || !objective.trim()) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.tickets.compile({
        slug: slug.trim() || slugify(objective),
        objective: objective.trim(),
      });
      setMessage(`Compiled ${result.ticket.ticket_id} · receipt ${result.receipt.id}`);
      setObjective('');
      setSlug('');
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const orchestrate = async () => {
    if (!api || busy || !objective.trim()) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.tickets.orchestrate({
        slug: slug.trim() || slugify(objective),
        objective: objective.trim(),
      });
      setMessage(`Orchestrated ${result.ticket.ticket_id} · worker ${result.worker.id} · run ${result.run.id}`);
      setObjective('');
      setSlug('');
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const orchestrateSelected = async () => {
    if (!api || busy || !selected) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.tickets.orchestrateExisting(selected.ticket_id);
      setMessage(`Orchestrated ${result.ticket.ticket_id} · worker ${result.worker.id} · run ${result.run.id}`);
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const advanceStatus = async (
    status: TicketRecord['status'],
    review?: import('../runtime').TicketReviewRecord,
  ) => {
    if (!api || busy || !selected) return;
    setBusy(true);
    setError(null);
    try {
      await api.tickets.updateStatus(selected.ticket_id, review ? { status, review } : { status });
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const activeWorker = workerForTicket && ['running', 'blocked', 'review'].includes(workerForTicket.status)
    ? workerForTicket
    : null;

  const openCount = list.filter((t) => !['merged', 'cancelled'].includes(t.status)).length;
  const reviewCount = list.filter((t) => t.status === 'review').length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={ticketsCopy.eyebrow}
        title={ticketsCopy.title}
        lede={ticketsCopy.lede}
        proof={SURFACE_TESTS.tickets}
      />
      <SurfaceInk lead={ticketsCopy.inkLead} muted={ticketsCopy.inkMuted} sub={ticketsCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: ticketsCopy.statTotal, value: list.length },
          { label: ticketsCopy.statOpen, value: openCount, tone: openCount ? 'ok' : 'neutral' },
          { label: ticketsCopy.statReview, value: reviewCount, tone: reviewCount ? 'warn' : 'neutral' },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {message && <div className="notice"><span className="dot dot--ok" /> {message}</div>}
      {!tickets && !error && (
        <div className="panel">
          <div className="h-sec">Loading tickets…</div>
        </div>
      )}
      <SplitLayout
        list={
          <>
            {list.map((ticket) => (
              <button
                key={ticket.ticket_id}
                className={`card${ticket.ticket_id === selected?.ticket_id ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(ticket.ticket_id)}
              >
                <div className="between">
                  <span className="card__title">{ticket.objective.slice(0, 72)}</span>
                  {statusPill(ticket.status)}
                </div>
                <span className="card__sub">{ticket.ticket_id}</span>
              </button>
            ))}
            {tickets && !list.length && (
              <InlineEmpty title={listEmpty.tickets?.title ?? 'No tickets yet'} body={listEmpty.tickets?.body ?? ''} />
            )}
          </>
        }
        detail={selected ? (
          <div className="detail">
            <div className="panel">
              <div className="between">
                <div className="h-sec">{selected.ticket_id}</div>
                {statusPill(selected.status)}
              </div>
              <p className="lede" style={{ marginTop: 8 }}>{selected.objective}</p>
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy || !!activeWorker}
                  onClick={orchestrateSelected}
                >
                  Orchestrate selected
                </button>
                {selected.status === 'proposed' && (
                  <button type="button" className="btn" disabled={busy} onClick={() => void advanceStatus('active')}>
                    Start implementation
                  </button>
                )}
                {selected.status === 'active' && (
                  <button type="button" className="btn" disabled={busy} onClick={() => void advanceStatus('review')}>
                    Send to review
                  </button>
                )}
                {selected.status === 'review' && (
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      void advanceStatus('merged', {
                        verdict: '+1',
                        evidence: [selected.receipt_path ?? `receipts/${selected.ticket_id}.md`],
                        reviewed_at: new Date().toISOString(),
                      })
                    }
                  >
                    Mark merged (reviewer +1)
                  </button>
                )}
                {activeWorker && (
                  <span className="muted">Active worker {activeWorker.id} — finish or fail before re-orchestrating.</span>
                )}
              </div>
              <ChipList values={selected.checks} empty="No checks" />
              {selected.branch && <span className="filechip" style={{ marginTop: 10 }}>branch · {selected.branch}</span>}
              {selected.model && <span className="filechip" style={{ marginTop: 10 }}>model · {selected.model}</span>}
              {selected.worktree && <span className="filechip" style={{ marginTop: 10 }}>worktree · {selected.worktree}</span>}
              {selected.owner && <span className="filechip" style={{ marginTop: 10 }}>owner · {selected.owner}</span>}
            </div>
            {!!selected.acceptance_criteria.length && (
              <div className="panel">
                <div className="eyebrow">acceptance criteria</div>
                <ul className="list" style={{ marginTop: 8 }}>
                  {selected.acceptance_criteria.map((ac) => (
                    <li key={ac.id}><strong>{ac.id}</strong> {ac.text}</li>
                  ))}
                </ul>
              </div>
            )}
            {workerForTicket && (
              <div className="panel">
                <div className="eyebrow">worker status</div>
                <div className="between" style={{ marginTop: 10 }}>
                  <span className="mono">{workerForTicket.id}</span>
                  {statusPill(workerForTicket.status)}
                </div>
                <p className="muted" style={{ marginTop: 8 }}>{workerForTicket.summary}</p>
              </div>
            )}
          </div>
        ) : null}
      />
      {!!tickets?.skipped && (
        <p className="muted" style={{ marginTop: 8 }}>{tickets.skipped} malformed ticket folder{tickets.skipped === 1 ? '' : 's'} skipped.</p>
      )}
      {(workers?.workers.length ?? 0) > 0 && (
        <div className="panel">
          <div className="eyebrow">all workers</div>
          <div className="receiptEvidence" style={{ marginTop: 12 }}>
            {workers!.workers.slice(0, 10).map((worker) => (
              <div className="zone receiptEvidenceRow" key={worker.id}>
                <span className="zone__tag">{worker.status}</span>
                <div>
                  <div className="mono">{worker.id}</div>
                  <div className="muted">{worker.ticket_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <SurfaceMeta label={ticketsCopy.metaLabel}>
        <input
          style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Objective for the worker slice…"
        />
        <input
          style={{ width: '100%', marginTop: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Optional slug (defaults from objective)"
        />
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <button type="button" className="btn" disabled={busy || !objective.trim()} onClick={compile}>Compile ticket</button>
          <button type="button" className="btn btn--primary" disabled={busy || !objective.trim()} onClick={orchestrate}>Orchestrate in worktree</button>
        </div>
        <span className="filechip" style={{ marginTop: 12 }}>{Icon.file} {tickets?.dir ?? '~/.otto/tickets'}</span>
        {selected?.packetPath && <span className="filechip">{selected.packetPath}</span>}
        {selected?.ticketPath && <span className="filechip">{selected.ticketPath}</span>}
      </SurfaceMeta>
      <SurfaceProof surface="tickets" />
    </SurfacePage>
  );
};

/* ---------- Channels ---------- */
export const Channels: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<ChannelListResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.channels.list()
      .then((next) => { if (!cancelled) setResult(next); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [api]);

  if (!api) {
    return <WebPreviewFrame surface="channels" />;
  }

  const channels = result?.channels ?? [];
  const enabledCount = channels.filter((c) => c.enabled).length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={channelsCopy.eyebrow}
        title={channelsCopy.title}
        lede={channelsCopy.lede}
        proof={SURFACE_TESTS.channels}
      />
      <SurfaceInk lead={channelsCopy.inkLead} muted={channelsCopy.inkMuted} sub={channelsCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: channelsCopy.statConfigured, value: channels.length },
          { label: channelsCopy.statEnabled, value: enabledCount, tone: enabledCount ? 'ok' : 'neutral' },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {!result && !error && (
        <div className="panel">
          <div className="h-sec">Loading channels…</div>
        </div>
      )}
      {result && !channels.length && !error && (
        <InlineEmpty title={listEmpty.channels?.title ?? 'No channels configured'} body={listEmpty.channels?.body ?? ''} />
      )}
      <div className="cards">
        {channels.map((channel) => (
          <div className="card" key={channel.id}>
            <div className="between">
              <span className="card__title">{channel.label}</span>
              <span className={`pill ${channel.enabled ? 'pill--ok' : 'pill--warn'}`}>{channel.enabled ? 'enabled' : 'disabled'}</span>
            </div>
            <span className="card__sub">{channel.kind} · {channel.address}</span>
            {channel.requires_approval_to_send && (
              <span className="pill pill--warn" style={{ marginTop: 8 }}>approval required to send</span>
            )}
          </div>
        ))}
      </div>
      <SurfaceMeta label={channelsCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.configPath ?? 'channels/channels.yaml'}</span>
        <span className="pill pill--ok">{result?.storage ?? 'files'}</span>
      </SurfaceMeta>
      <SurfaceProof surface="channels" />
    </SurfacePage>
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
  const [primaryAgentId, setPrimaryAgentId] = useState('');
  const [connectionMode, setConnectionMode] = useState<'embedded' | 'existing' | 'cloud'>('embedded');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.connection.get().then((c) => {
      setBaseUrl(c.baseUrl ?? '');
      setAgentId(c.agentId ?? '');
    });
    api.config.get().then((cfg) => {
      setPrimaryAgentId(cfg.primaryAgentId ?? cfg.agentId ?? '');
      setConnectionMode(cfg.connectionMode ?? 'embedded');
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
      await api.config.set({
        primaryAgentId: primaryAgentId.trim() || null,
        connectionMode,
      });
      setStatus(next);
      rt.updateStatus(next);
    } finally {
      setBusy(false);
    }
  };

  const displayStatus = rt.status ?? status;
  const code: StatusCode = displayStatus?.ready ? 'ready' : displayStatus?.code ?? 'error';

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="eyebrow">connect letta</div>
        <StatusPill status={code} />
      </div>
      <div className="h-sec" style={{ marginTop: 6 }}>Local Letta connection</div>
      <p className="muted" style={{ marginTop: 4 }}>
        otto tries to discover Letta Desktop and your current local agent automatically. These fields are advanced overrides for the rare case discovery picks the wrong runtime or agent.
      </p>
      {displayStatus && !displayStatus.ready && displayStatus.reason && (
        <p className="faint" style={{ marginTop: 6 }}>↳ {displayStatus.reason}</p>
      )}
      <div className="grid" style={{ gap: 12, marginTop: 12 }}>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Local Letta URL · advanced override</span>
          <input
            style={inputStyle}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Auto-detect local runtime"
            spellCheck={false}
          />
        </label>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Agent ID · advanced override</span>
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
        <button type="button" className="btn btn--primary" onClick={connect} disabled={busy}>
          {busy ? 'Connecting…' : 'Save overrides & reconnect'}
        </button>
        {displayStatus?.ready && (
          <span className="muted" style={{ fontSize: 13 }}>
            {displayStatus.agentId}
            {displayStatus.baseUrl ? ` · ${displayStatus.baseUrl}` : ''}
            {displayStatus.model ? ` · ${displayStatus.model}` : ''}
            {displayStatus.effectiveTransport ? ` · ${displayStatus.effectiveTransport}` : ''}
          </span>
        )}
      </div>
      {displayStatus && (
        <p className="faint" style={{ marginTop: 8, fontSize: 12 }}>
          Transport: {displayStatus.transportMode ?? 'sdk'} → {displayStatus.effectiveTransport ?? 'sdk subprocess'}
          {displayStatus.transportFallbackReason ? ` (fallback: ${displayStatus.transportFallbackReason})` : ''}
        </p>
      )}
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
  <div className="zone" style={{ gridTemplateColumns: '190px minmax(0, 1fr) auto', gap: 16 }}>
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
        <button type="button" className="btn btn--primary" onClick={openLetta}>Open Letta</button>
      </div>

      <div className="segmented" role="tablist" aria-label="Provider type">
        <button type="button" className={tab === 'local' ? 'is-active' : ''} onClick={() => setTab('local')}>Local</button>
        <button type="button" className={tab === 'cloud' ? 'is-active' : ''} onClick={() => setTab('cloud')}>Cloud</button>
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
              <button type="button" className="btn" onClick={openLetta}>{active ? 'Manage' : 'Connect'}</button>
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

/* ---------- Settings (Setup + Readiness) ---------- */
const MemoryObservatory: React.FC<{ connected: boolean; onOpenLetta: () => void }> = ({ connected, onOpenLetta }) => {
  const api = ottoApi();
  const [result, setResult] = useState<import('../runtime').MemoryListResult | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api?.memory) return;
    let cancelled = false;
    api.memory.list()
      .then((next) => { if (!cancelled) setResult(next); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [api]);

  const blocks = result?.blocks ?? [];
  const filtered = query.trim()
    ? blocks.filter((b) =>
      b.label.toLowerCase().includes(query.toLowerCase())
      || b.value.toLowerCase().includes(query.toLowerCase())
      || (b.description?.toLowerCase().includes(query.toLowerCase()) ?? false),
    )
    : blocks;

  return (
    <div className="grid" style={{ maxWidth: 880, gap: 16 }}>
      <div className="panel">
        <div className="between">
          <div>
            <div className="eyebrow">read-only</div>
            <div className="h-sec">Letta memory observatory</div>
          </div>
          <button type="button" className="btn" onClick={onOpenLetta}>Open in Letta</button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Inspects Letta core-memory blocks via `{result?.apiPath ?? '/v1/agents/{id}/core-memory/blocks'}`. Otto does not write memory here — use Curation proposals for writeback.
        </p>
        {!connected && (
          <div className="notice" style={{ marginTop: 12 }}>
            <span className="dot dot--warn" /> Connect Letta in Settings before expecting live blocks.
          </div>
        )}
        {(result?.error || error) && (
          <div className="notice" style={{ marginTop: 12 }}>
            <span className="dot dot--warn" /> {result?.error ?? error}
          </div>
        )}
        <input
          style={{ width: '100%', marginTop: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blocks…"
          disabled={!blocks.length}
        />
      </div>
      {filtered.map((block) => (
        <div className="panel" key={block.id}>
          <div className="between">
            <span className="h-sec">{block.label}</span>
            {block.updated_at && <span className="faint mono">{block.updated_at}</span>}
          </div>
          {block.description && <p className="muted" style={{ marginTop: 6 }}>{block.description}</p>}
          <pre className="mono" style={{ marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 240, overflow: 'auto' }}>{block.value || '(empty)'}</pre>
          {block.limit != null && <span className="filechip" style={{ marginTop: 8 }}>limit · {block.limit}</span>}
        </div>
      ))}
      {result && !result.error && !filtered.length && (
        <div className="panel"><p className="muted">No memory blocks match. Connect an agent or adjust search.</p></div>
      )}
      <SurfaceProof surface="settings" />
    </div>
  );
};

export const Settings: React.FC = () => {
  const rt = useRuntimeContext();
  const api = ottoApi();
  const { push: pushToast } = useToast();
  const [section, setSection] = useState<'general' | 'providers' | 'memory' | 'culture'>('general');

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('otto.settings.section');
      if (pending === 'memory') {
        setSection('memory');
        sessionStorage.removeItem('otto.settings.section');
      }
    } catch { /* best effort */ }
  }, []);

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
        <button type="button" className={section === 'general' ? 'is-active' : ''} onClick={() => setSection('general')}>
          {Icon.settings}<span>General</span>
        </button>
        <button type="button" className={section === 'providers' ? 'is-active' : ''} onClick={() => setSection('providers')}>
          {Icon.lock}<span>Model providers</span>
        </button>
        <button type="button" className={section === 'memory' ? 'is-active' : ''} onClick={() => setSection('memory')}>
          {Icon.theme}<span>Memory observatory</span>
        </button>
        {api ? (
          <button type="button" className={section === 'culture' ? 'is-active' : ''} onClick={() => setSection('culture')}>
            {Icon.file}<span>Culture</span>
          </button>
        ) : null}
      </aside>

      {section === 'providers' ? (
        <ModelProviders />
      ) : section === 'memory' ? (
        <MemoryObservatory connected={liveConnected} onOpenLetta={() => void ottoApi()?.runtime.openLetta()} />
      ) : section === 'culture' && api ? (
        <CultureSettingsPanel api={api} pushToast={pushToast} />
      ) : (
        <SurfacePage className="settingsGeneral">
          <SurfaceHero
            eyebrow={settingsCopy.eyebrow}
            title={settingsCopy.title}
            lede={settingsCopy.lede}
            proof={SURFACE_TESTS.settings}
          />
          <SurfaceInk lead={settingsCopy.inkLead} muted={settingsCopy.inkMuted} sub={settingsCopy.inkSub} />
          <SurfaceStatStrip
            stats={[
              {
                label: settingsCopy.statRuntime,
                value: liveConnected ? 'Connected' : 'Not connected',
                tone: liveConnected ? 'ok' : 'warn',
              },
              {
                label: settingsCopy.statRequired,
                value: liveConnected ? 0 : requiredMissing.length,
                tone: requiredMissing.length && !liveConnected ? 'warn' : 'neutral',
              },
            ]}
          />
          <div className="grid" style={{ maxWidth: 880, gap: 16 }}>
          <ConnectLetta />
          <div className="panel">
            <div className="eyebrow">onboarding</div>
            <div className="h-sec" style={{ marginTop: 6 }}>Show onboarding again</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Clears the first-run flag so Welcome and the getting-started dock return on next launch.
              Also clears the onboarding first-message marker so Done/Skip stays honest after a replay.
            </p>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 12 }}
              onClick={() => {
                resetOnboardingForReplay();
                pushToast({ title: 'Onboarding reset', body: 'Relaunch otto to see Welcome again.', tone: 'ok' });
              }}
            >
              Reset onboarding
            </button>
          </div>
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
                Live Letta runtime connected. Expand readiness detail below for file-backed checks.
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
          <SurfaceMeta label={settingsCopy.metaReadiness}>
            <div className="panel" style={{ marginTop: 0, border: 'none', padding: 0 }}>
              <div className="eyebrow">runtime &amp; identity</div>
              <div style={{ marginTop: 4 }}>
                {group(['runtime', 'agent', 'model', 'memory', 'workspace']).map((r) => <ReadyRow key={r.key} item={r} />)}
              </div>
            </div>
            <div className="panel" style={{ marginTop: 12, border: 'none', padding: 0 }}>
              <div className="eyebrow">capabilities</div>
              <div style={{ marginTop: 4 }}>
                {group(['skills', 'practices', 'mcp', 'functions', 'permissions']).map((r) => <ReadyRow key={r.key} item={r} />)}
              </div>
            </div>
            <div className="panel" style={{ marginTop: 12, border: 'none', padding: 0 }}>
              <div className="eyebrow">v1 surfaces</div>
              <div style={{ marginTop: 4 }}>
                {group(['charters', 'standards', 'routines', 'curation', 'receipts', 'autonomy', 'knowledge', 'tickets', 'channels']).map((r) => (
                  <ReadyRow key={r.key} item={r} />
                ))}
              </div>
            </div>
          </SurfaceMeta>
          <p className="faint mono" style={{ fontSize: 11.5 }}>
            v1 is local-only: otto connects to a local Letta runtime. Cloud/self-host auth can come later as an advanced path.
          </p>
          <SurfaceProof surface="settings" />
          </div>
        </SurfacePage>
      )}
    </div>
  );
};

const CultureSettingsPanel: React.FC<{
  api: NonNullable<ReturnType<typeof ottoApi>>;
  pushToast: ReturnType<typeof useToast>['push'];
}> = ({ api, pushToast }) => {
  const [yamlDraft, setYamlDraft] = useState('');
  const [bundlePath, setBundlePath] = useState('');
  const [importPath, setImportPath] = useState('');
  const [importPreview, setImportPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.constitution.get()
      .then((result) => {
        if (!cancelled) setYamlDraft(result.rawYaml);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const amend = async () => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await api.constitution.amend(yamlDraft, 'operator');
      if ('blocked' in outcome && outcome.blocked) {
        setError(outcome.errors.join(' · '));
        pushToast({
          title: toastCopy.decisionBlocked,
          body: outcome.receipt.blocker?.message ?? 'Constitution validation failed',
          tone: 'warn',
        });
      } else if ('receipt' in outcome) {
        pushToast({
          title: toastCopy.behaviorUpdated,
          body: `Constitution amended · receipt ${outcome.receipt.id}`,
          tone: 'ok',
        });
        const fresh = await api.constitution.get();
        setYamlDraft(fresh.rawYaml);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportCulture = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.culture.export();
      setBundlePath(result.bundlePath);
      pushToast({
        title: cultureSettingsCopy.exportDone,
        body: result.bundlePath,
        tone: 'ok',
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const previewImport = async () => {
    if (!importPath.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const preview = await api.culture.importPreview(importPath.trim());
      setImportPreview(JSON.stringify(preview, null, 2));
    } catch (e) {
      setError(String(e));
      setImportPreview(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid" style={{ maxWidth: 880, gap: 16 }}>
      <div className="panel">
        <div className="eyebrow">{cultureSettingsCopy.eyebrow}</div>
        <div className="h-sec" style={{ marginTop: 6 }}>{cultureSettingsCopy.title}</div>
        <p className="muted" style={{ marginTop: 6 }}>{cultureSettingsCopy.lede}</p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <button type="button" className="btn" disabled={busy} onClick={() => void api.constitution.open()}>
            {cultureSettingsCopy.openConstitution}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void exportCulture()}>
            {cultureSettingsCopy.exportCulture}
          </button>
        </div>
        {bundlePath ? <p className="mono faint" style={{ marginTop: 8, fontSize: 11.5 }}>{bundlePath}</p> : null}
      </div>
      <div className="panel">
        <div className="eyebrow">{cultureSettingsCopy.amendTitle}</div>
        <textarea
          className="mono"
          rows={14}
          value={yamlDraft}
          onChange={(e) => setYamlDraft(e.target.value)}
          disabled={busy}
          style={{ width: '100%', marginTop: 8 }}
        />
        <button type="button" className="btn btn--solid-d" style={{ marginTop: 12 }} disabled={busy} onClick={() => void amend()}>
          {cultureSettingsCopy.amendSave}
        </button>
      </div>
      <div className="panel">
        <div className="eyebrow">{cultureSettingsCopy.importPreview}</div>
        <input
          type="text"
          className="mono"
          placeholder="Path to otto-culture-export-….zip"
          value={importPath}
          onChange={(e) => setImportPath(e.target.value)}
          disabled={busy}
          style={{ width: '100%', marginTop: 8 }}
        />
        <button type="button" className="btn" style={{ marginTop: 12 }} disabled={busy || !importPath.trim()} onClick={() => void previewImport()}>
          Preview import (dry-run)
        </button>
        {importPreview ? <pre className="receiptJson mono" style={{ marginTop: 12 }}>{importPreview}</pre> : null}
      </div>
      {error ? <div className="notice"><span className="dot dot--warn" /> {error}</div> : null}
      <SurfaceProof surface="settings" />
    </div>
  );
};
