import React, { useEffect, useMemo, useState } from 'react';
import { PaperclipIntakePanel } from './PaperclipIntakePanel';
import { Icon } from '../components/icons';
import { useToast } from '../components/Toast';
import { EmptyState, StatusPill, statusPill, statusCodePill, SurfaceProof, SurfacePage, SurfaceHero, InkBlock, SurfaceInk, SurfaceStatStrip, SurfaceMeta, SplitLayout, FilterBar, InlineEmpty, WebPreviewFrame, ReceiptCard, CheckBlockBanner } from '../components/ui';
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
  isolatedAgentBoundaryOptions,
  listEmpty,
  cultureSettingsCopy,
  labsCopy,
  loaderCopy,
} from '../copy/surfaces';
import { resetOnboardingForReplay } from '../onboarding-storage';
import { saveConnectionAndReconnect } from '../connection-reconnect';
import {
  STANDARD_DOMAINS,
  domainForStandard,
  filterStandards,
  groupStandardsByDomain,
  type StandardDomain,
  type StandardStatusFilter,
} from '../standards-filter';
import {
  persistDisplayTheme,
  readStoredDisplayTheme,
  watchSystemDisplayTheme,
  type DisplayTheme,
} from '../display-preferences';
import { LabsBlockedShell } from '../labs/LabsBlockedShell';
import {
  getSampleReceiptDetail,
  isSampleReceiptPreview,
  sampleReceiptSummary,
  sampleReceiptCard,
  SAMPLE_RECEIPT_LABEL,
} from '../onboarding-sample-receipt';
import { useLabs, LAB_FEATURE_IDS, LAB_FEATURE_META } from '../labs/LabsContext';
import { effectiveConnectionMode } from '../surface-tiers';
import { AppSourceDetails } from '../components/AppSourceBadge';
import type { AppBuildInfo, IsolatedAgentRecord, LabFeatureId, WorkspaceInfo, SystemHealthReport, HealthCheck } from '../../electron/shared/types';
import {
  ottoApi,
  type CharterDetail,
  type CharterListResult,
  type CharterStatus,
  type CurationProposalRecord,
  type PracticeListResult,
  type PracticeMetricsSnapshot,
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
  type StandardsRegistry,
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
  type StandardConflictResult,
  type CogneeHealth,
  type CogneeCaptureReceipt,
  type CogneeRecallSmokeResult,
  type PgvectorStatus,
  type MemoryListResult,
  type MemoryBlockRecord,
  type ProviderMirrorSnapshot,
  type DreamSettings,
  type DreamTrigger,
  type ConversationSortMode,
} from '../runtime';
import { useRuntimeContext } from '../RuntimeContext';
import { ReadinessPanel } from '../ReadinessPanel';
import type { SurfaceId } from '../components/Sidebar';

const EmptySurface = EmptyState;

type SkippedFile = { slug: string; file: string; reason: string };

const SkippedLoaderPanel: React.FC<{ skipped: SkippedFile[]; noun?: string }> = ({ skipped, noun = 'file' }) => {
  if (!skipped.length) return null;
  return (
    <details className="detailSection skippedPanel" open={skipped.length <= 3}>
      <summary className="between">
        <div>
          <div className="eyebrow">{loaderCopy.eyebrow}</div>
          <div className="h-sec">{loaderCopy.skippedTitle(skipped.length, noun)}</div>
        </div>
        <span className="pill pill--warn">{loaderCopy.validationPill}</span>
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

      <div className="panel charterCreatePanel">
        <div className="eyebrow">{chartersCopy.createEyebrow}</div>
        <div className="h-sec" style={{ marginTop: 6 }}>{chartersCopy.createTitle}</div>
        <div className="charterCreate">
          <label className="charterField">
            <span>{chartersCopy.objectiveLabel}</span>
            <input
              className="charterInput"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder={chartersCopy.objectivePlaceholder}
            />
          </label>
          <label className="charterField">
            <span>{chartersCopy.criterionLabel}</span>
            <input
              className="charterInput"
              value={criterion}
              onChange={(e) => setCriterion(e.target.value)}
              placeholder={chartersCopy.criterionPlaceholder}
            />
          </label>
          <label className="charterField">
            <span>{chartersCopy.slugLabel}</span>
            <input
              className="charterInput mono"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={objective ? slugify(objective) : 'auto'}
            />
          </label>
          <button className="btn btn--primary" onClick={createCharter} disabled={busy || !objective.trim() || !criterion.trim()}>
            {chartersCopy.createButton}
          </button>
        </div>
      </div>

      <SplitLayout
        listClassName="charterList"
        listAriaLabel="Charters list"
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
              <div className="detailSection charterEmptyList">
                <p className="muted">{chartersCopy.loadingList}</p>
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
        <div className="detailSection">
          <div className="h-sec">{chartersCopy.selectTitle}</div>
          <p className="muted" style={{ marginTop: 6 }}>{chartersCopy.selectBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail charterDetail">
      <div className="detailSection">
        <div className="between">
          <div>
            <div className="eyebrow">{chartersCopy.detailEyebrow}</div>
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

      <div className="detailGrid detailGrid--2">
        <div className="detailSection">
          <div className="eyebrow">{chartersCopy.acEyebrow}</div>
          <ul className="list">
            {detail.acceptance_criteria.map((ac) => (
              <li key={ac.id}>
                <strong>{ac.id}</strong> {ac.text}
                {!!ac.receipts.length && <span className="faint"> · {ac.receipts.length} receipt{ac.receipts.length === 1 ? '' : 's'}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="detailSection">
          <div className="eyebrow">{chartersCopy.approvalEyebrow}</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {detail.approval_required_for_changes.map((gate) => <span className="pill pill--warn" key={gate}>{gate}</span>)}
          </div>
        </div>
      </div>

      <div className="detailGrid detailGrid--2">
        <div className="detailSection">
          <div className="eyebrow">{chartersCopy.linkedRunsEyebrow}</div>
          <ChipList values={detail.run_ids} empty={chartersCopy.noRunLinked} />
        </div>
        <div className="detailSection">
          <div className="eyebrow">{chartersCopy.linkedReceiptsEyebrow}</div>
          <ChipList values={detail.receipt_ids} empty={chartersCopy.noReceiptLinked} />
        </div>
      </div>

      <div className="detailGrid detailGrid--2">
        <div className="detailSection charterAction">
          <div className="eyebrow">{chartersCopy.attachEyebrow}</div>
          <input className="charterInput mono" value={runId} onChange={(e) => setRunId(e.target.value)} placeholder={chartersCopy.runIdPlaceholder} aria-label="Run ID" />
          <input className="charterInput mono" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} placeholder={chartersCopy.receiptIdPlaceholder} aria-label="Receipt ID" />
          <button className="btn" onClick={onLinkRunReceipt} disabled={busy || (!runId.trim() && !receiptId.trim())}>{chartersCopy.attachButton}</button>
        </div>
        <div className="detailSection charterAction">
          <div className="eyebrow">{chartersCopy.statusEyebrow}</div>
          <select className="charterInput" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as CharterStatus)} aria-label="Charter status">
            {CHARTER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {statusDraft === 'complete' && detail.acceptance_criteria.some((ac) => !ac.receipts.length) && (
            <p className="muted" style={{ marginTop: 8 }}>
              {chartersCopy.completeRequiresReceipt(detail.acceptance_criteria.filter((ac) => !ac.receipts.length).map((ac) => ac.id).join(', '))}
            </p>
          )}
          <input className="charterInput" value={statusSummary} onChange={(e) => setStatusSummary(e.target.value)} placeholder={chartersCopy.statusSummaryPlaceholder} aria-label="Status change summary" />
          <button className="btn" onClick={onUpdateStatus} disabled={busy || statusDraft === detail.status}>{chartersCopy.updateButton}</button>
        </div>
      </div>

      <div className="detailSection">
        <div className="eyebrow">{chartersCopy.changesEyebrow}</div>
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
function formatStandardDomain(domain: StandardDomain | 'uncategorized'): string {
  if (domain === 'uncategorized') return 'Other';
  return domain.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function standardStatusPill(status: string) {
  if (status === 'deprecated') return <StatusPill status={status} label={standardsCopy.filterDeprecated} />;
  return statusPill(status);
}

export const Standards: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<StandardListResult | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StandardStatusFilter>('all');
  const [domainFilter, setDomainFilter] = useState<'all' | StandardDomain>('all');

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

  const standards = result?.standards ?? [];
  const filtered = useMemo(
    () => filterStandards(standards, { query, status: statusFilter, domain: domainFilter }),
    [standards, query, statusFilter, domainFilter],
  );
  const grouped = useMemo(() => groupStandardsByDomain(filtered), [filtered]);
  const selected = filtered.find((standard) => standard.slug === selectedSlug)
    ?? filtered[0]
    ?? null;
  const activeCount = standards.filter((s) => s.status === 'active').length;

  useEffect(() => {
    if (!selectedSlug && filtered[0]) setSelectedSlug(filtered[0].slug);
    if (selectedSlug && filtered.length && !filtered.some((s) => s.slug === selectedSlug)) {
      setSelectedSlug(filtered[0]?.slug ?? null);
    }
  }, [filtered, selectedSlug]);

  if (!api) {
    return <WebPreviewFrame surface="standards" />;
  }

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={standardsCopy.eyebrow}
        title={standardsCopy.title}
        lede={standardsCopy.lede}
      />
      <SurfaceInk lead={standardsCopy.inkLead} muted={standardsCopy.inkMuted} sub={standardsCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: standardsCopy.statLoaded, value: standards.length },
          { label: standardsCopy.statActive, value: activeCount, tone: activeCount ? 'ok' : 'neutral' },
        ]}
      />
      {result && (
        <div className="ratificationStrip">
          <span className="zone__tag">ratification</span>
          <span className="muted">
            {standardsCopy.ratificationOwner} {result.registry.ratification.owner} · {standardsCopy.ratificationAutoApply} {String(result.registry.ratification.auto_apply ?? false)}
          </span>
          <span className="filechip">{Icon.file} {result.registryPath ?? 'standards/registry.yaml'}</span>
        </div>
      )}
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      <SkippedLoaderPanel skipped={result?.skipped ?? []} />
      {result && standards.length > 0 && (
        <>
          <input
            className="charterInput settingsGeneralSection__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={standardsCopy.searchPlaceholder}
            aria-label={standardsCopy.searchPlaceholder}
          />
          <FilterBar
            options={[
              { key: 'all', label: standardsCopy.filterAll },
              { key: 'active', label: standardsCopy.filterActive },
              { key: 'draft', label: standardsCopy.filterDraft },
              { key: 'deprecated', label: standardsCopy.filterDeprecated },
            ]}
            active={statusFilter}
            onSelect={(key) => setStatusFilter(key as StandardStatusFilter)}
          />
          <FilterBar
            options={[
              { key: 'all', label: standardsCopy.filterDomainAll },
              ...STANDARD_DOMAINS.map((domain) => ({ key: domain, label: formatStandardDomain(domain) })),
            ]}
            active={domainFilter}
            onSelect={(key) => setDomainFilter(key as 'all' | StandardDomain)}
          />
        </>
      )}
      <SplitLayout
        list={
          <>
            {result === null ? (
              <div className="listEmpty">
                <p className="muted">{standardsCopy.loadingTitle}</p>
              </div>
            ) : !standards.length ? (
              <InlineEmpty title={listEmpty.standards?.title ?? 'No Standards loaded'} body={listEmpty.standards?.body ?? ''} />
            ) : !filtered.length ? (
              <InlineEmpty title={standardsCopy.searchNoMatch} body={listEmpty.standards?.body ?? ''} />
            ) : (
              grouped.map(({ domain, items }) => (
                <div key={domain} className="standardsDomainGroup">
                  <div className="eyebrow">{formatStandardDomain(domain)}</div>
                  {items.map((standard) => (
                    <button
                      key={standard.slug}
                      className={`card${standard.slug === selected?.slug ? ' is-selected' : ''}`}
                      onClick={() => setSelectedSlug(standard.slug)}
                    >
                      <div className="between">
                        <span className="card__title">{standard.name}</span>
                        {standardStatusPill(standard.status)}
                      </div>
                      <span className="card__sub">{standard.meaning}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </>
        }
        detail={
          selected
            ? <StandardDetail standard={selected} registry={result?.registry ?? null} />
            : filtered.length
              ? <InlineEmpty title={standardsCopy.selectTitle} body={standardsCopy.selectBody} />
              : null
        }
      />
      {result && (
        <SurfaceMeta label={standardsCopy.metaLabel}>
          <span className="filechip">{standards.length} loaded</span>
          {filtered.length !== standards.length && (
            <span className="filechip">{filtered.length} shown</span>
          )}
        </SurfaceMeta>
      )}
      {result?.registry?.conflicts?.length ? (
        <div className="detailSection">
          <div className="eyebrow">{standardsCopy.tensionMapEyebrow}</div>
          <ul className="list">
            {result.registry.conflicts.map((conflict) => (
              <li key={conflict.between.join('-')}>
                <button type="button" className="linkish" onClick={() => setSelectedSlug(conflict.between[0] ?? null)}>
                  {conflict.between.join(' vs ')}
                </button>
                <span className="muted"> — {conflict.tie_breaker}</span>
                {conflict.precedent
                  ? <span className="filechip">{conflict.precedent}</span>
                  : <span className="faint"> no case law yet</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SurfacePage>
  );
};

const StandardDetail: React.FC<{ standard: StandardRecord; registry: StandardsRegistry | null }> = ({ standard, registry }) => {
  const api = ottoApi();
  const [conflict, setConflict] = useState<StandardConflictResult | null>(null);

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
      <div className="detailSection detailSection--warn">
        <div className="eyebrow">{standardsCopy.conflictEyebrow}</div>
        <div className="h-sec conflictTitle">
          {conflict.between.length > 1 ? conflict.between.join(' vs ') : conflict.between[0]}
        </div>
        <p className="muted conflictMessage">{conflict.message}</p>
        {conflict.tie_breaker && (
          <p className="conflictTieBreaker">
            <strong>{standardsCopy.conflictTieBreaker}</strong> {conflict.tie_breaker}
          </p>
        )}
        {conflict.precedent?.excerpt && (
          <pre className="mono conflictExcerpt">{conflict.precedent.excerpt}</pre>
        )}
        {conflict.precedent?.file && (
          <span className="filechip conflictFile">{conflict.precedent.file}</span>
        )}
        {!conflict.precedent && (
          <p className="muted conflictPropose">{standardsCopy.conflictProposeCuration}</p>
        )}
      </div>
    )}
    {!conflict && (
      <p className="muted">{standardsCopy.conflictNoneHint}</p>
    )}
    <div className="detailSection">
      <div className="between">
        <div>
          <div className="eyebrow">standard detail</div>
          <div className="h-sec">{standard.name}</div>
        </div>
        {standardStatusPill(standard.status)}
      </div>
      <p className="lede" style={{ marginTop: 8 }}>{standard.meaning}</p>
      <dl className="kv charterKv">
        <div><dt>schema</dt><dd>{standard.schema}</dd></div>
        <div><dt>slug</dt><dd className="mono">{standard.slug}</dd></div>
        <div><dt>version</dt><dd>{standard.version}</dd></div>
        <div><dt>{standardsCopy.domainLabel}</dt><dd>{formatStandardDomain(domainForStandard(standard))}</dd></div>
        <div><dt>file</dt><dd className="mono">{standard.file}</dd></div>
      </dl>
    </div>

    {standard.markdown && (
      <div className="detailSection">
        <div className="eyebrow">{standardsCopy.canonBodyEyebrow}</div>
        <pre className="mono standardsMarkdownExcerpt">{standard.markdown.slice(0, 1200)}{standard.markdown.length > 1200 ? '…' : ''}</pre>
      </div>
    )}

    <div className="detailSection">
      <div className="eyebrow">{standardsCopy.curationPathEyebrow}</div>
      <p className="muted">{standardsCopy.curationPathBody}</p>
    </div>

    <div className="detailGrid detailGrid--2">
      <div className="detailSection">
        <div className="eyebrow">under pressure · do</div>
        <ul className="list">{standard.under_pressure.do.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="detailSection">
        <div className="eyebrow">under pressure · refuse</div>
        <ul className="list">{standard.under_pressure.refuse.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>

    <div className="detailGrid detailGrid--2">
      <div className="detailSection">
        <div className="eyebrow">evidence</div>
        <ul className="list">{standard.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="detailSection">
        <div className="eyebrow">citation path</div>
        <p className="muted">Receipts cite this file by slug and path.</p>
        <span className="filechip" style={{ marginTop: 10 }}>{standard.slug} · {standard.file}</span>
      </div>
    </div>

    {!!standard.related_anti_patterns?.length && (
      <div className="detailSection">
        <div className="eyebrow">{standardsCopy.antiPatternsEyebrow}</div>
        <ChipList values={standard.related_anti_patterns} empty="" />
      </div>
    )}

    {!!registry?.anti_patterns?.length && (
      <div className="detailSection">
        <div className="eyebrow">{standardsCopy.antiPatternsEyebrow} · registry</div>
        <ChipList values={registry.anti_patterns} empty="" />
      </div>
    )}
  </div>
  );
};

/* ---------- Practices ---------- */
const RUNTIME_PRACTICE_SLUGS = new Set(['charter', 'review', 'field-note']);

function formatPracticeLastRun(iso: string | null | undefined): string {
  if (!iso) return 'Never run';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function trialPayloadForPractice(slug: string): { invocation?: string; payload?: Record<string, unknown> } {
  switch (slug) {
    case 'charter':
      return { invocation: '/charter step', payload: { intent: 'Practices surface trial run' } };
    case 'review':
      return {
        invocation: '/review done',
        payload: {
          acceptance_criteria: [{ id: 'AC1', text: 'Practice run emits receipt with practice ref' }],
          evidence: [],
        },
      };
    case 'field-note':
      return {
        invocation: '/field-note capture',
        payload: {
          raw_note: 'Trial field note from Practices surface Run.',
          source: { who: 'operator', role: 'practices-surface', where: 'desktop', when: new Date().toISOString().slice(0, 10) },
        },
      };
    default:
      return {};
  }
}

export const Practices: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<PracticeListResult | null>(null);
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [metrics, setMetrics] = useState<PracticeMetricsSnapshot | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    if (!api || !selectedSlug) {
      setMetrics(null);
      return;
    }
    let cancelled = false;
    api.practices.metrics(selectedSlug)
      .then((next) => {
        if (!cancelled) setMetrics(next);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api, selectedSlug, runMessage]);

  const runPractice = async () => {
    if (!api || !selectedSlug || busy || !RUNTIME_PRACTICE_SLUGS.has(selectedSlug)) return;
    setBusy(true);
    setRunMessage(null);
    setError(null);
    try {
      const trial = trialPayloadForPractice(selectedSlug);
      const run = await api.practices.run({ slug: selectedSlug, ...trial });
      const status = run.blocked ? 'blocked' : 'recorded';
      setRunMessage(`Practice run ${status}: ${run.receipt.id}`);
      const [receiptResult, nextMetrics] = await Promise.all([
        api.receipts.list(),
        api.practices.metrics(selectedSlug),
      ]);
      setReceipts(receiptResult.receipts);
      setMetrics(nextMetrics);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

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
  const runnableCount = practices.filter((p) => RUNTIME_PRACTICE_SLUGS.has(p.slug)).length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={practicesCopy.eyebrow}
        title={practicesCopy.title}
        lede={practicesCopy.lede}
      />
      <SurfaceInk lead={practicesCopy.inkLead} muted={practicesCopy.inkMuted} sub={practicesCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: practicesCopy.statLoaded, value: practices.length },
          { label: practicesCopy.statWithReceipts, value: withProofCount },
          { label: practicesCopy.statRunnable, value: runnableCount },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {runMessage && <div className="notice"><span className="dot dot--ok" /> {runMessage}</div>}
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
        detail={selected ? (
          <PracticeDetail
            practice={selected}
            relatedReceipts={relatedReceipts}
            metrics={metrics}
            runnable={RUNTIME_PRACTICE_SLUGS.has(selected.slug)}
            busy={busy}
            onRun={runPractice}
          />
        ) : null}
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

const PracticeDetail: React.FC<{
  practice: PracticeRecord;
  relatedReceipts: ReceiptSummary[];
  metrics: PracticeMetricsSnapshot | null;
  runnable: boolean;
  busy: boolean;
  onRun: () => void;
}> = ({ practice, relatedReceipts, metrics, runnable, busy, onRun }) => (
  <div className="detail">
    <div className="detailSection">
      <div className="between">
        <div className="h-sec">{practice.name}</div>
        {statusPill(practice.status)}
      </div>
      <p className="lede" style={{ marginTop: 6 }}>{practice.summary}</p>
      <ChipList values={practice.invocations ?? []} empty={practicesCopy.noInvocations} />
    </div>
    {runnable && (
      <div className="detailSection">
        <div className="between">
          <div>
            <div className="eyebrow">practice run</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Records run id + receipt under ~/.otto. Last run: {formatPracticeLastRun(metrics?.last_used_at)}
            </p>
            {metrics?.last_receipt_id && (
              <span className="filechip" style={{ marginTop: 8 }}>receipt: {metrics.last_receipt_id}</span>
            )}
          </div>
          <button className="btn btn--primary" disabled={busy} onClick={onRun}>
            {busy ? 'Running…' : 'Run'}
          </button>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="filechip">uses: {metrics?.uses ?? 0}</span>
          <span className="filechip">success: {metrics?.successful_runs ?? 0}</span>
          <span className="filechip">blocked: {metrics?.blocked_runs ?? 0}</span>
        </div>
      </div>
    )}
    <div className="detailGrid detailGrid--2">
      <div className="detailSection">
        <div className="eyebrow">guardrails</div>
        <ul className="list">{(practice.guardrails ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
      <div className="detailSection">
        <div className="eyebrow">evidence standard</div>
        <ul className="list">{(practice.evidence_standard ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
    </div>
    <div className="detailSection">
      <div className="eyebrow">approval floor · cannot be bypassed</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {(practice.approval_required_for ?? []).map((item) => <span className="pill pill--warn" key={item}>{item}</span>)}
      </div>
    </div>
    <div className="detailSection">
      <div className="eyebrow">citation path</div>
      <p className="muted">Receipts link invocations back to this file by slug and path.</p>
      <span className="filechip" style={{ marginTop: 10 }}>{practice.slug} · {practice.file}</span>
    </div>
    <div className="detailSection">
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
    <div className="detailSection">
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
    <div className="detailSection">
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
    <div className="detailSection">
      <div className="eyebrow">activation gate</div>
      <p className="lede" style={{ marginTop: 8 }}>{gate?.reason ?? 'Checking activation gate…'}</p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span className={`pill ${gate?.allowed ? 'pill--ok' : 'pill--warn'}`}>
          recurring activation {gate?.allowed ? 'allowed' : 'blocked'}
        </span>
        {gate?.requiresApproval && <span className="pill pill--warn">approval required</span>}
      </div>
    </div>
    <div className="detailSection">
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
            body: [
              toastCopy.behaviorUpdatedBody(targetLabel, selected.summary, outcome.receipt.id),
              outcome.compiledCheckId ? `${toastCopy.checkActive}: ${outcome.compiledCheckId}` : null,
            ].filter(Boolean).join('\n'),
            tone: 'ok',
            actionLabel: toastCopy.openReceipt,
            onAction: () => { if (typeof location !== 'undefined') location.hash = 'receipts'; },
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

      <div className="surfaceToolbar">
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
        {mainPanel === 'inbox' && selected ? (
          <span className="filechip mono curationPathChip" title={selected.path}>{selected.path}</span>
        ) : null}
        {mainPanel === 'inbox' ? (
          <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/curation/proposals/'}</span>
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
        <span className="filechip">{proposals.length} proposals</span>
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
    <div className="detailSection">
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
    <div className="detailSection">
      <div className="eyebrow">{curationCopy.classificationEyebrow}</div>
      <div className="receiptEvidence" style={{ marginTop: 12 }}>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">{curationCopy.zoneRisk}</span>
          <div className="mono">{proposal.classification.risk} · {proposal.classification.route}</div>
        </div>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">{curationCopy.zoneGate}</span>
          <div className="mono">{proposal.classification.required_gate}</div>
        </div>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">{curationCopy.zoneCanon}</span>
          <div className="mono">{proposal.classification.canon_impact}{proposal.target.id ? ` · ${proposal.target.id}` : ''}</div>
        </div>
        <div className="zone receiptEvidenceRow">
          <span className="zone__tag">{curationCopy.zoneReason}</span>
          <div>{proposal.classification.reason}</div>
        </div>
      </div>
    </div>
    <div className="detailSection">
      <div className="eyebrow">{curationCopy.evidenceEyebrow}</div>
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
      <div className="detailSection ratificationPanel">
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
    </SurfaceMeta>
  </div>
);

/* ---------- Receipts (runs + proof) ---------- */
const RECEIPT_FILTERS: Array<'all' | ReceiptStatus> = ['all', 'success', 'blocked', 'failed'];
type ReceiptAuthorityFilter = 'all' | 'human' | 'autonomy' | 'runtime';
const RECEIPT_AUTHORITY_FILTERS: ReceiptAuthorityFilter[] = ['all', 'human', 'autonomy', 'runtime'];

function receiptAuthorityBucket(receipt: ReceiptSummary): Exclude<ReceiptAuthorityFilter, 'all'> {
  if (
    receipt.action.startsWith('curation.')
    || receipt.subjectType === 'proposal'
    || receipt.action.startsWith('permission:')
    || receipt.action.startsWith('constitution.')
  ) return 'human';
  if (receipt.action.startsWith('autonomy:') || receipt.action.startsWith('autonomy.')) return 'autonomy';
  return 'runtime';
}

function receiptAuthorityFilterLabel(filter: ReceiptAuthorityFilter): string {
  if (filter === 'all') return receiptsCopy.filterAuthorityAll;
  if (filter === 'human') return receiptsCopy.filterAuthorityHuman;
  if (filter === 'autonomy') return receiptsCopy.filterAuthorityAutonomy;
  return receiptsCopy.filterAuthorityRuntime;
}

export const Receipts: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<ReceiptListResult | null>(null);
  const [runsResult, setRunsResult] = useState<RunListResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ReceiptStatus>('all');
  const [authorityFilter, setAuthorityFilter] = useState<ReceiptAuthorityFilter>('all');
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
      if (authorityFilter !== 'all' && receiptAuthorityBucket(receipt) !== authorityFilter) return false;
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
  }, [authorityFilter, filter, query, receipts]);
  const selectedSummary = receipts.find((receipt) => receipt.id === selectedId) ?? null;
  const statusCounts = useMemo(() => ({
    success: receipts.filter((r) => r.status === 'success').length,
    blocked: receipts.filter((r) => r.status === 'blocked').length,
    failed: receipts.filter((r) => r.status === 'failed').length,
  }), [receipts]);

  if (!api) {
    return <WebPreviewFrame surface="receipts" />;
  }

  if (!loading && !receipts.length && isSampleReceiptPreview()) {
    const sampleDetail = getSampleReceiptDetail();
    return (
      <SurfacePage className="receiptsSurface">
        <div className="onboardSampleBanner">{SAMPLE_RECEIPT_LABEL}</div>
        <SurfaceHero
          eyebrow={receiptsCopy.eyebrow}
          title={receiptsCopy.emptyTitle}
          lede={receiptsCopy.sampleLede}
        />
        <SplitLayout
          list={(
            <ReceiptCard
              receipt={sampleReceiptCard}
              selected
              onSelect={() => {}}
            />
          )}
          detail={<ReceiptDetailView detail={sampleDetail} summary={sampleReceiptSummary} />}
        />
        <SurfaceProof surface="receipts" />
      </SurfacePage>
    );
  }

  if (!loading && !receipts.length) {
    return (
      <SurfacePage className="receiptsSurface">
        <SurfaceHero
          eyebrow={receiptsCopy.eyebrow}
          title={receiptsCopy.emptyTitle}
          lede={receiptsCopy.emptyBody}
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
      />

      <SurfaceStatStrip
        stats={[
          { label: receiptsCopy.statTotal, value: receipts.length },
          { label: receiptsCopy.statSuccess, value: statusCounts.success, tone: 'ok' },
          { label: receiptsCopy.statBlocked, value: statusCounts.blocked, tone: statusCounts.blocked > 0 ? 'warn' : 'neutral' },
          { label: receiptsCopy.statFailed, value: statusCounts.failed, tone: statusCounts.failed > 0 ? 'warn' : 'neutral' },
        ]}
      />

      <div className="surfaceToolbar receiptToolbar">
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
          <FilterBar
            options={RECEIPT_AUTHORITY_FILTERS.map((item) => ({
              key: item,
              label: receiptAuthorityFilterLabel(item),
            }))}
            active={authorityFilter}
            onSelect={(key) => setAuthorityFilter(key as ReceiptAuthorityFilter)}
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
        listClassName="receiptList"
        listAriaLabel="Receipts list"
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
        <div className="detailSection">
          <InlineEmpty title={receiptsCopy.selectTitle} body={receiptsCopy.selectBody} />
        </div>
      </div>
    );
  }

  if (!detail || detail.id !== summary.id) {
    return (
      <div className="detail">
        <div className="detailSection">
          <div className="h-sec">{receiptsCopy.loadingTitle}</div>
          <p className="muted" style={{ marginTop: 6 }}>{summary.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail receiptDetail">
      <div className="detailSection receiptDetail__authority">
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
        <div className="detailSection receiptBlocker">
          <div className="between">
            <div className="eyebrow">blocker</div>
            <span className="pill pill--warn">{detail.blocker.code}</span>
          </div>
          <p className="lede" style={{ marginTop: 8 }}>{detail.blocker.message}</p>
          {detail.blocker.next_action && <p className="muted" style={{ marginTop: 6 }}>{detail.blocker.next_action}</p>}
        </div>
      )}

      {detail.evidence.length > 0 ? (
        <div className="detailSection">
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
        <div className="detailSection">
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
        <div className="detailSection">
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
        <div className="detailSection">
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

      <div className="detailGrid detailGrid--3 autonomyZones">
        {(policy?.zones ?? []).map((zone) => (
          <div className="detailSection" key={zone.id}>
            <div className="between">
              <div className="eyebrow">{zone.id}</div>
              <span className={`pill ${zoneClass(zone.id)}`}>
                {zone.requires_approval ? autonomyCopy.zoneApproval : autonomyCopy.zoneAutonomous}
              </span>
            </div>
            <div className="card__title autonomyZone__title">{zone.label}</div>
            <p className="muted autonomyZone__summary">{zone.summary}</p>
            <ul className="list autonomyZone__examples">
              {zone.examples.slice(0, 4).map((example, index) => <li key={index}>{example}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="detailSection">
        <div className="eyebrow">{autonomyCopy.doorsEyebrow}</div>
        <div className="row autonomyDoors">
          {(policy?.doors ?? []).map((door) => (
            <span className="pill pill--warn" key={door.id}>{door.label}</span>
          ))}
        </div>
      </div>

      <div className="detailSection autonomyEvaluate">
        <div className="eyebrow">{autonomyCopy.evaluateEyebrow}</div>
        <p className="muted autonomyEvaluate__hint">{autonomyCopy.evaluateHint}</p>
        <input
          className="charterInput autonomyEvaluate__input"
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          placeholder={autonomyCopy.evaluatePlaceholder}
          aria-label={autonomyCopy.evaluatePlaceholder}
        />
        <div className="row autonomyEvaluate__actions">
          <button type="button" className="btn" disabled={busy} onClick={evaluate}>
            {busy ? autonomyCopy.evaluatingButton : autonomyCopy.evaluateButton}
          </button>
        </div>
        {evaluation && (
          <div className="zone receiptEvidenceRow autonomyEvaluate__result">
            <span className={`pill ${zoneClass(evaluation.zone)}`}>{evaluation.zone}</span>
            <div>
              <div className="card__title">
                {evaluation.requires_approval ? autonomyCopy.evalApprovalRequired : autonomyCopy.evalMayProceed}
              </div>
              <p className="muted autonomyEvaluate__reason">{evaluation.reason}</p>
              {evaluation.knowledge_routing && (
                <p className="muted autonomyEvaluate__routing">
                  {autonomyCopy.evalRoutingPrefix}{' '}
                  {evaluation.knowledge_routing.role} → {evaluation.knowledge_routing.provider}/{evaluation.knowledge_routing.model} ({evaluation.knowledge_routing.status})
                </p>
              )}
              {receiptId && (
                <div className="mono receiptEvidenceRef autonomyEvaluate__receipt">
                  {autonomyCopy.evalReceiptPrefix} {receiptId}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SurfaceMeta label={autonomyCopy.metaLabel}>
        <span className="filechip">{Icon.file} {loaded?.policyPath ?? 'autonomy/policy.yaml'}</span>
        <span className="filechip">{autonomyCopy.safeAutoMergeLabel}: {policy?.settings.safe_auto_merge ?? '…'}</span>
        {knowledge?.registry ? (
          <p className="muted autonomyMeta__hint">{autonomyCopy.routingKnowledgeHint}</p>
        ) : null}
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
      />
      <SurfaceInk lead={skillsCopy.inkLead} muted={skillsCopy.inkMuted} sub={skillsCopy.inkSub} />
      <SurfaceStatStrip stats={[{ label: skillsCopy.statLoaded, value: skills.length }]} />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      <SkippedLoaderPanel skipped={result?.skipped ?? []} />
      {!result && !error && (
        <div className="detailSection">
          <div className="h-sec">{skillsCopy.loadingTitle}</div>
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
              <div className="detailSection">
                <div className="h-sec">{selected.name}</div>
                <p className="lede" style={{ marginTop: 8 }}>{selected.description}</p>
                <div className="eyebrow" style={{ marginTop: 16 }}>{skillsCopy.triggersEyebrow}</div>
                <ChipList values={selected.triggers} empty={skillsCopy.noTriggers} />
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

/* ---------- Knowledge — Cognee + pgvector ---------- */
const CogneeKnowledgePanel: React.FC = () => {
  const api = ottoApi();
  const [health, setHealth] = useState<CogneeHealth | null>(null);
  const [capture, setCapture] = useState<CogneeCaptureReceipt | null>(null);
  const [recall, setRecall] = useState<CogneeRecallSmokeResult | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!api?.cognee) return;
    const [nextHealth, nextCapture] = await Promise.all([
      api.cognee.health(),
      api.cognee.latestCapture(),
    ]);
    setHealth(nextHealth);
    setCapture(nextCapture);
  };

  useEffect(() => {
    void reload();
  }, [api]);

  if (!api?.cognee) return null;

  const runRecallSmoke = async () => {
    setBusy(true);
    try {
      setRecall(await api.cognee!.recallSmoke('otto receipt precedent'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="detailSection knowledgePanel">
      <div className="between">
        <div>
          <div className="eyebrow">{knowledgeCopy.cogneeEyebrow}</div>
          <div className="h-sec">{knowledgeCopy.cogneeTitle}</div>
        </div>
        {health ? statusPill(health.status) : null}
      </div>
      {health?.status === 'disabled' && (
        <LabsBlockedShell
          title={labsCopy.cogneeBlockedTitle}
          body={labsCopy.cogneeBlockedBody}
          onAction={() => void reload()}
          actionLabel={labsCopy.startSidecar}
        />
      )}
      {health && health.status !== 'disabled' && (
        <>
          <p className="muted" style={{ marginTop: 8 }}>
            {knowledgeCopy.cogneeLoopback(health.baseUrl ?? '—', health.lastCheckedAt ?? undefined)}
          </p>
          {health.lastError && health.status !== 'ready' && (
            <div className="notice" style={{ marginTop: 12 }}>
              <span className="dot dot--warn" /> {health.lastError}
            </div>
          )}
          {capture ? (
            <div className="receiptEvidence" style={{ marginTop: 12 }}>
              <div className="zone receiptEvidenceRow">
                <span className="zone__tag">{knowledgeCopy.zoneLastCapture}</span>
                <div className="mono">{capture.id ?? capture.at}</div>
              </div>
              {typeof capture.count === 'number' && (
                <div className="zone receiptEvidenceRow">
                  <span className="zone__tag">{knowledgeCopy.zoneDocs}</span>
                  <div>{capture.count}</div>
                </div>
              )}
              {Array.isArray(capture.paths) && capture.paths.length > 0 && (
                <div className="zone receiptEvidenceRow">
                  <span className="zone__tag">{knowledgeCopy.zonePath}</span>
                  <div className="mono">{capture.paths[0]}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>{knowledgeCopy.cogneeNoCapture}</p>
          )}
          <div className="between" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn" disabled={busy} onClick={() => void reload()}>{knowledgeCopy.cogneeRefresh}</button>
            <button type="button" className="btn" disabled={busy || health.status !== 'ready'} onClick={() => void runRecallSmoke()}>
              {knowledgeCopy.cogneeRecallSmoke}
            </button>
          </div>
          {recall && (
            <div style={{ marginTop: 12 }}>
              {recall.ok && recall.citations.length > 0 ? (
                recall.citations.map((c: { path: string; snippet: string }) => (
                  <div className="zone receiptEvidenceRow" key={c.path}>
                    <span className="zone__tag">{knowledgeCopy.zoneCitation}</span>
                    <div>
                      <div className="mono">{c.path}</div>
                      <div className="muted">{c.snippet}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="notice">
                  <span className="dot dot--warn" /> {recall.error ?? knowledgeCopy.cogneeNoCitations}
                </div>
              )}
            </div>
          )}
        </>
      )}
      <span className="filechip" style={{ marginTop: 12 }}>{Icon.file} docs/cognee.md</span>
    </div>
  );
};

const PgvectorKnowledgePanel: React.FC = () => {
  const api = ottoApi();
  const [status, setStatus] = useState<PgvectorStatus | null>(null);

  useEffect(() => {
    if (!api?.pgvector) return;
    let cancelled = false;
    api.pgvector.status().then((next) => { if (!cancelled) setStatus(next); });
    return () => { cancelled = true; };
  }, [api]);

  if (!api?.pgvector || !status) return null;

  return (
    <div className="detailSection knowledgePanel">
      <div className="between">
        <div>
          <div className="eyebrow">{knowledgeCopy.pgvectorEyebrow}</div>
          <div className="h-sec">{knowledgeCopy.pgvectorTitle}</div>
        </div>
        {statusPill(
          !status.enabled
            ? 'disabled'
            : status.state === 'ready'
              ? 'ready'
              : status.state === 'stopped'
                ? 'stopped'
                : 'error',
        )}
      </div>
      {!status.enabled && (
        <LabsBlockedShell
          title={labsCopy.pgvectorBlockedTitle}
          body={labsCopy.pgvectorBlockedBody}
        />
      )}
      {status.enabled && status.state !== 'ready' && (
        <div className="notice" style={{ marginTop: 12 }}>
          <span className="dot dot--warn" /> {status.note}
          {status.connectionHint ? ` · ${status.connectionHint}` : ''}
        </div>
      )}
      {status.enabled && status.state === 'ready' && (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {status.note}
          {status.lastIndexedAt ? ` Last index: ${status.lastIndexedAt}.` : ' No index run yet.'}
        </p>
      )}
    </div>
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
        <InlineEmpty title={knowledgeCopy.registryNotFoundTitle} body={knowledgeCopy.registryNotFoundBody(result.registryPath)} />
      )}
      {!result && !error && (
        <div className="detailSection">
          <div className="h-sec">{knowledgeCopy.loadingTitle}</div>
        </div>
      )}
      {registry && (
        <>
          {registry.status === 'proposed' && (
            <div className="notice">
              <span className="dot dot--warn" />
              {knowledgeCopy.registryProposedPrefix}
              {registry.last_reviewed ? ` Last reviewed ${registry.last_reviewed}.` : ''}
            </div>
          )}
          <div className="detailSection">
            <div className="between">
              <div className="eyebrow">{knowledgeCopy.routingEyebrow}</div>
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
          <div className="detailSection">
            <div className="eyebrow">{knowledgeCopy.modelsEyebrow}</div>
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
      <div className="detailGrid detailGrid--2 knowledgeRecallGrid">
        <CogneeKnowledgePanel />
        <PgvectorKnowledgePanel />
      </div>
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
  const [checkBlock, setCheckBlock] = useState<{ checkName: string; message: string; receiptId?: string; standardId?: string } | null>(null);
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
    setCheckBlock(null);
    try {
      await api.tickets.updateStatus(selected.ticket_id, review ? { status, review } : { status });
      await reload();
    } catch (e) {
      const raw = String(e);
      const receiptMatch = raw.match(/\(receipt:\s*([^)]+)\)/);
      if (receiptMatch || raw.toLowerCase().includes('not done')) {
        setCheckBlock({
          checkName: 'completion-requires-receipts',
          message: raw.replace(/\s*\(receipt:[^)]+\)\s*$/, '').trim(),
          receiptId: receiptMatch?.[1]?.trim(),
          standardId: 'no-fake-done',
        });
      } else {
        setError(raw);
      }
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
      />
      <SurfaceInk lead={ticketsCopy.inkLead} muted={ticketsCopy.inkMuted} sub={ticketsCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: ticketsCopy.statTotal, value: list.length },
          { label: ticketsCopy.statOpen, value: openCount, tone: openCount ? 'ok' : 'neutral' },
          { label: ticketsCopy.statReview, value: reviewCount, tone: reviewCount ? 'warn' : 'neutral' },
        ]}
      />
      <PaperclipIntakePanel />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {checkBlock && (
        <CheckBlockBanner
          checkName={checkBlock.checkName}
          message={checkBlock.message}
          receiptId={checkBlock.receiptId}
          standardId={checkBlock.standardId}
          onOpenReceipt={checkBlock.receiptId ? () => { location.hash = 'receipts'; } : undefined}
          onOpenStandard={checkBlock.standardId ? () => { location.hash = 'standards'; } : undefined}
        />
      )}
      {message && <div className="notice"><span className="dot dot--ok" /> {message}</div>}
      {!tickets && !error && (
        <div className="panel">
          <div className="h-sec">Loading tickets…</div>
        </div>
      )}
      <div className="panel ticketCreatePanel">
        <div className="eyebrow">{ticketsCopy.createEyebrow}</div>
        <div className="h-sec" style={{ marginTop: 6 }}>{ticketsCopy.createTitle}</div>
        <div className="charterCreate">
          <label className="charterField">
            <span>{ticketsCopy.objectiveLabel}</span>
            <input
              className="charterInput"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder={ticketsCopy.objectivePlaceholder}
            />
          </label>
          <label className="charterField">
            <span>{ticketsCopy.slugLabel}</span>
            <input
              className="charterInput mono"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={ticketsCopy.slugPlaceholder}
            />
          </label>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn" disabled={busy || !objective.trim()} onClick={compile}>{ticketsCopy.compile}</button>
            <button type="button" className="btn btn--primary" disabled={busy || !objective.trim()} onClick={orchestrate}>{ticketsCopy.orchestrate}</button>
          </div>
        </div>
      </div>
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
            <div className="detailSection">
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
              <ChipList values={selected.checks} empty={ticketsCopy.noChecks} />
              {selected.branch && <span className="filechip" style={{ marginTop: 10 }}>branch · {selected.branch}</span>}
              {selected.model && <span className="filechip" style={{ marginTop: 10 }}>model · {selected.model}</span>}
              {selected.worktree && <span className="filechip" style={{ marginTop: 10 }}>worktree · {selected.worktree}</span>}
              {selected.owner && <span className="filechip" style={{ marginTop: 10 }}>owner · {selected.owner}</span>}
            </div>
            {!!selected.acceptance_criteria.length && (
              <div className="detailSection">
                <div className="eyebrow">acceptance criteria</div>
                <ul className="list" style={{ marginTop: 8 }}>
                  {selected.acceptance_criteria.map((ac) => (
                    <li key={ac.id}><strong>{ac.id}</strong> {ac.text}</li>
                  ))}
                </ul>
              </div>
            )}
            {workerForTicket && (
              <div className="detailSection">
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
        <span className="filechip">{Icon.file} {tickets?.dir ?? '~/.otto/tickets'}</span>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.channels.list()
      .then((next) => { if (!cancelled) setResult(next); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [api]);

  const channels = result?.channels ?? [];
  const enabledCount = channels.filter((c) => c.enabled).length;

  useEffect(() => {
    if (!channels.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => (prev && channels.some((c) => c.id === prev) ? prev : channels[0]?.id ?? null));
  }, [channels]);

  const selected = channels.find((c) => c.id === selectedId) ?? null;

  if (!api) {
    return <WebPreviewFrame surface="channels" />;
  }

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={channelsCopy.eyebrow}
        title={channelsCopy.title}
        lede={channelsCopy.lede}
      />
      <SurfaceInk lead={channelsCopy.inkLead} muted={channelsCopy.inkMuted} sub={channelsCopy.inkSub} />
      <SurfaceStatStrip
        stats={[
          { label: channelsCopy.statConfigured, value: channels.length },
          { label: channelsCopy.statEnabled, value: enabledCount, tone: enabledCount ? 'ok' : 'neutral' },
        ]}
      />
      {error && <div className="notice"><span className="dot dot--warn" /> {error}</div>}
      {result && enabledCount === 0 && channels.length > 0 && (
        <LabsBlockedShell
          title={labsCopy.channelsBlockedTitle}
          body={labsCopy.channelsBlockedBody}
          next={labsCopy.channelsBlockedNext}
        />
      )}
      {!result && !error && (
        <div className="detailSection">
          <div className="h-sec">{channelsCopy.loadingTitle}</div>
        </div>
      )}
      {result && !channels.length && !error && (
        <InlineEmpty title={listEmpty.channels?.title ?? 'No channels configured'} body={listEmpty.channels?.body ?? ''} />
      )}
      <SkippedLoaderPanel
        noun="channel row"
        skipped={(result?.skipped ?? []).map((item) => ({
          slug: `row-${item.index}`,
          file: `${item.file}#channels[${item.index}]`,
          reason: item.reason,
        }))}
      />
      {channels.length > 0 && (
        <SplitLayout
          list={
            <>
              {channels.map((channel) => (
                <button
                  type="button"
                  key={channel.id}
                  className={`card${channel.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(channel.id)}
                >
                  <div className="between">
                    <span className="card__title">{channel.label}</span>
                    <span className={`pill ${channel.enabled ? 'pill--ok' : 'pill--warn'}`}>{channel.enabled ? channelsCopy.enabledLabel : channelsCopy.disabledLabel}</span>
                  </div>
                  <span className="card__sub">{channel.kind} · {channel.address}</span>
                </button>
              ))}
            </>
          }
          detail={
            selected ? (
              <div className="detail">
                <div className="detailSection">
                  <div className="between">
                    <div>
                      <div className="eyebrow">{selected.kind}</div>
                      <div className="h-sec">{selected.label}</div>
                    </div>
                    <span className={`pill ${selected.enabled ? 'pill--ok' : 'pill--warn'}`}>{selected.enabled ? channelsCopy.enabledLabel : channelsCopy.disabledLabel}</span>
                  </div>
                  <dl className="kv" style={{ marginTop: 16 }}>
                    <div>
                      <dt>{channelsCopy.addressLabel}</dt>
                      <dd className="mono">{selected.address}</dd>
                    </div>
                    <div>
                      <dt>{channelsCopy.outboundLabel}</dt>
                      <dd>{selected.requires_approval_to_send ? channelsCopy.outboundApproval : channelsCopy.outboundDirect}</dd>
                    </div>
                    <div>
                      <dt>{channelsCopy.configFileLabel}</dt>
                      <dd className="mono">{selected.file}</dd>
                    </div>
                  </dl>
                  {selected.requires_approval_to_send && (
                    <p className="muted" style={{ marginTop: 12 }}>{channelsCopy.approvalNote}</p>
                  )}
                </div>
              </div>
            ) : (
              <InlineEmpty title={channelsCopy.selectTitle} body={channelsCopy.selectBody} />
            )
          }
        />
      )}
      <SurfaceMeta label={channelsCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.configPath ?? 'channels/channels.yaml'}</span>
        <span className="pill pill--ok">{result?.storage ?? 'files'}</span>
      </SurfaceMeta>
      <SurfaceProof surface="channels" />
    </SurfacePage>
  );
};

/* ---------- Connect Letta (live setup) ---------- */
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
  const { labs, isFeatureEnabled } = useLabs();
  const cloudConnectionAllowed = isFeatureEnabled('remote_letta_cloud');
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [agentId, setAgentId] = useState('');
  const [primaryAgentId, setPrimaryAgentId] = useState('');
  const [connectionMode, setConnectionMode] = useState<'embedded' | 'existing' | 'cloud'>('existing');
  const [busy, setBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    api.connection.get().then((c) => {
      setBaseUrl(c.baseUrl ?? '');
      setAgentId(c.agentId ?? '');
    });
    api.config.get().then((cfg) => {
      setPrimaryAgentId(cfg.primaryAgentId ?? cfg.agentId ?? '');
      setConnectionMode(cfg.connectionMode ?? 'existing');
    });
    api.runtime.status().then(setStatus).catch(() => {});
  }, [api]);

  if (!api) {
    return (
      <div className="settingsBlock">
        <p className="settingsFieldHint">
          The desktop app auto-detects the local Letta runtime and current/default agent.
          This web preview cannot open the Electron bridge, so manual overrides are disabled here.
        </p>
      </div>
    );
  }

  const connect = async () => {
    setBusy(true);
    setConnectError(null);
    try {
      const next = await saveConnectionAndReconnect(api, {
        baseUrl,
        agentId,
        primaryAgentId,
        connectionMode: effectiveConnectionMode(connectionMode, labs),
      });
      setStatus(next);
      rt.updateStatus(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setConnectError(message);
    } finally {
      setBusy(false);
    }
  };

  const displayStatus = rt.status ?? status;
  const code: StatusCode = displayStatus?.ready ? 'ready' : displayStatus?.code ?? 'error';
  const displayedConnectionMode = effectiveConnectionMode(connectionMode, labs);

  return (
    <div className="settingsBlock">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <p className="settingsFieldHint" style={{ margin: 0 }}>
          {settingsCopy.primaryAgentHint}
        </p>
        {statusCodePill(code)}
      </div>
      <div className="settingsField">
        <label>
          <span>{settingsCopy.primaryAgentLabel}</span>
          <input
            className="mono"
            style={inputStyle}
            value={primaryAgentId}
            onChange={(e) => setPrimaryAgentId(e.target.value)}
            placeholder="Default agent for this workspace"
            spellCheck={false}
          />
        </label>
      </div>
      <div className="row settingsGeneralSection__actions">
        <button type="button" className="btn" onClick={() => void api.runtime.openLetta()}>
          {settingsCopy.primaryAgentOpenLetta}
        </button>
      </div>
      <div className="settingsField">
        <label>
          <span>{settingsCopy.connectionModeLabel}</span>
          <select
            style={inputStyle}
            value={displayedConnectionMode}
            onChange={(e) => setConnectionMode(e.target.value as 'embedded' | 'existing' | 'cloud')}
          >
            <option value="embedded">{settingsCopy.connectionEmbedded}</option>
            <option value="existing">{settingsCopy.connectionExisting}</option>
            {cloudConnectionAllowed ? (
              <option value="cloud">{settingsCopy.connectionCloud}</option>
            ) : null}
          </select>
        </label>
        {!cloudConnectionAllowed ? (
          <p className="settingsFieldHint" style={{ marginTop: 8 }}>
            <span className="pill">{labsCopy.previewBadge}</span>{' '}
            {settingsCopy.connectionCloudLabsHint}
          </p>
        ) : null}
      </div>
      {displayStatus && !displayStatus.ready && displayStatus.reason && (
        <p className="faint" style={{ margin: 0 }}>↳ {displayStatus.reason}</p>
      )}
      {connectError && (
        <p className="faint" style={{ margin: 0, color: 'var(--warn)' }}>
          ↳ {settingsCopy.connectionFailedPrefix} {connectError}
        </p>
      )}
      <div className="settingsField">
        <label>
          <span>{settingsCopy.connectionLocalUrlLabel}</span>
          <input
            style={inputStyle}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={settingsCopy.connectionLocalUrlPlaceholder}
            spellCheck={false}
          />
        </label>
      </div>
      <div className="settingsField">
        <label>
          <span>{settingsCopy.connectionAgentIdLabel}</span>
          <input
            className="mono"
            style={inputStyle}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder={settingsCopy.connectionAgentIdPlaceholder}
            spellCheck={false}
          />
        </label>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--primary" onClick={connect} disabled={busy}>
          {busy ? settingsCopy.connectionSaveBusy : settingsCopy.connectionSaveIdle}
        </button>
        {displayStatus?.ready && (
          <span className="muted" style={{ fontSize: 13 }}>
            {`${settingsCopy.readinessConnected}${displayStatus.model ? ` · ${displayStatus.model}` : ''}${displayStatus.effectiveTransport ? ` · ${displayStatus.effectiveTransport}` : ''}`}
          </span>
        )}
      </div>
      {displayStatus && (
        <p className="faint" style={{ margin: 0, fontSize: 12 }}>
          Transport: {displayStatus.transportMode ?? 'sdk'} → {displayStatus.effectiveTransport ?? 'sdk subprocess'}
          {displayStatus.transportFallbackReason ? ` (fallback: ${displayStatus.transportFallbackReason})` : ''}
        </p>
      )}
    </div>
  );
};

const IsolatedAgentPanel: React.FC = () => {
  const api = ottoApi();
  const { push: pushToast } = useToast();
  const [agents, setAgents] = useState<IsolatedAgentRecord[]>([]);
  const [boundaryReason, setBoundaryReason] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!api?.isolatedAgents) return;
    void api.isolatedAgents.list().then((result) => setAgents(result.agents)).catch(() => setAgents([]));
  };

  useEffect(() => {
    refresh();
  }, [api]);

  if (!api?.isolatedAgents) {
    return (
      <p className="settingsFieldHint">
        Isolated agent creation is available in the desktop app after Letta is connected.
      </p>
    );
  }

  const create = async () => {
    if (!boundaryReason) {
      setError(settingsCopy.isolatedAgentBoundaryPlaceholder);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.isolatedAgents.create({
        boundaryReason: boundaryReason as IsolatedAgentRecord['boundaryReason'],
        label: label.trim() || null,
      });
      setBoundaryReason('');
      setLabel('');
      refresh();
      pushToast({
        title: settingsCopy.isolatedAgentCreateSuccess,
        body: settingsCopy.isolatedAgentCreateSuccessBody,
        tone: 'ok',
      });
      if (result.receipt?.path) {
        pushToast({
          title: settingsCopy.isolatedAgentReceiptNote,
          body: result.receipt.id,
          tone: 'info',
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const boundaryLabel = (id: IsolatedAgentRecord['boundaryReason']) =>
    isolatedAgentBoundaryOptions.find((row) => row.id === id)?.label ?? id;

  return (
    <div className="settingsBlock">
      <p className="settingsFieldHint">{settingsCopy.isolatedAgentStandardsNote}</p>
      <div className="settingsField">
        <label>
          <span>{settingsCopy.isolatedAgentBoundaryLabel}</span>
          <select
            style={inputStyle}
            value={boundaryReason}
            onChange={(e) => setBoundaryReason(e.target.value)}
          >
            <option value="">{settingsCopy.isolatedAgentBoundaryPlaceholder}</option>
            {isolatedAgentBoundaryOptions.map((row) => (
              <option key={row.id} value={row.id}>{row.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="settingsField">
        <label>
          <span>{settingsCopy.isolatedAgentLabelField}</span>
          <input
            style={inputStyle}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={settingsCopy.isolatedAgentLabelPlaceholder}
            spellCheck={false}
          />
        </label>
      </div>
      {error ? <p className="faint" style={{ margin: 0, color: 'var(--warn)' }}>{error}</p> : null}
      <button type="button" className="btn btn--primary" onClick={() => void create()} disabled={busy}>
        {busy ? settingsCopy.isolatedAgentCreateBusy : settingsCopy.isolatedAgentCreate}
      </button>
      <div style={{ marginTop: 16 }}>
        <div className="settingsFieldRow__title">{settingsCopy.isolatedAgentListTitle}</div>
        {agents.length === 0 ? (
          <p className="settingsFieldHint">{settingsCopy.isolatedAgentListEmpty}</p>
        ) : (
          <ul className="settingsList">
            {agents.map((agent) => (
              <li key={agent.agentId} className="mono" style={{ fontSize: 12, marginBottom: 8 }}>
                {agent.label || agent.agentId}
                <span className="muted"> · {boundaryLabel(agent.boundaryReason)} · {agent.agentId}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const WorkspaceAndPermissionRoute: React.FC = () => {
  const api = ottoApi();
  const { push: pushToast } = useToast();
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);

  useEffect(() => {
    if (!api?.workspace) return;
    api.workspace.get().then(setWorkspace).catch(() => {});
    api.permissionSession?.list().then(setAllowedTools).catch(() => setAllowedTools([]));
  }, [api]);

  if (!api?.workspace) {
    return (
      <p className="settingsFieldHint">
        Workspace and permission controls are available in the desktop app.
      </p>
    );
  }

  const copyRepoPath = async () => {
    if (!workspace?.repoRoot) return;
    try {
      await navigator.clipboard.writeText(workspace.repoRoot);
      pushToast({
        title: settingsCopy.workspaceCopyToastTitle,
        body: settingsCopy.workspaceCopyToastBody,
        tone: 'ok',
      });
    } catch {
      pushToast({ title: 'Copy failed', body: 'Could not copy workspace path.', tone: 'warn' });
    }
  };

  const clearSession = async () => {
    await api.permissionSession!.clear();
    setAllowedTools([]);
    pushToast({
      title: settingsCopy.permissionRouteClearToastTitle,
      body: settingsCopy.permissionRouteClearToastBody,
      tone: 'ok',
    });
  };

  return (
    <div className="settingsBlock">
      <div className="settingsFieldRow">
        <div className="settingsFieldRow__main">
          <div className="settingsFieldRow__title">{settingsCopy.workspaceRepoTitle}</div>
          <p className="settingsFieldRow__hint">{settingsCopy.workspaceRepoHint}</p>
          {workspace && (
            <p className="mono faint" style={{ marginTop: 6, fontSize: 12, wordBreak: 'break-all' }}>
              {workspace.repoRoot}
            </p>
          )}
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <button type="button" className="btn" onClick={() => api.workspace!.reveal()}>
            {settingsCopy.workspaceReveal}
          </button>
          <button type="button" className="btn" onClick={copyRepoPath}>
            {settingsCopy.workspaceCopyPath}
          </button>
        </div>
      </div>
      {workspace && (
        <div className="settingsFieldRow">
          <div className="settingsFieldRow__main">
            <div className="settingsFieldRow__title">{settingsCopy.workspaceHomeTitle}</div>
            <p className="settingsFieldRow__hint">{settingsCopy.workspaceHomeHint}</p>
            <p className="mono faint" style={{ marginTop: 6, fontSize: 12, wordBreak: 'break-all' }}>
              {workspace.ottoHome}
            </p>
          </div>
        </div>
      )}
      <div className="settingsFieldRow">
        <div className="settingsFieldRow__main">
          <div className="settingsFieldRow__title">{settingsCopy.permissionRouteTitle}</div>
          <p className="settingsFieldRow__hint">{settingsCopy.permissionRouteHint}</p>
          {allowedTools.length ? (
            <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13 }}>
              {allowedTools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{settingsCopy.permissionRouteEmpty}</p>
          )}
        </div>
        <button type="button" className="btn" onClick={clearSession} disabled={!allowedTools.length}>
          {settingsCopy.permissionRouteClear}
        </button>
      </div>
    </div>
  );
};

const ConnectPgvector: React.FC = () => {
  const api = ottoApi();
  const [status, setStatus] = useState<PgvectorStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api?.pgvector) return;
    api.pgvector.status().then(setStatus).catch(() => {});
  }, [api]);

  if (!api?.pgvector) return null;

  const refresh = async () => {
    setBusy(true);
    try {
      const next = await api.pgvector!.status();
      setStatus(next);
    } finally {
      setBusy(false);
    }
  };

  const healthCode: StatusCode =
    !status?.enabled
      ? 'no-agent'
      : status.state === 'ready'
        ? 'ready'
        : status.state === 'disabled'
          ? 'no-agent'
          : 'error';

  return (
    <div className="settingsOptionalBlock">
      <div className="settingsOptionalBlock__head">
        <div className="settingsOptionalBlock__title">pgvector</div>
        <StatusPill status={healthCode} />
      </div>
      <p className="settingsOptionalBlock__lede">
        {labsCopy.pgvectorBlockedBody} Advanced env toggles live in docs/pgvector.md.
      </p>
      {status && (
        <p className="faint" style={{ marginTop: 8, fontSize: 12 }}>
          {status.state}
          {status.connectionHint ? ` · ${status.connectionHint}` : ''}
          {status.lastIndexedAt ? ` · indexed ${status.lastIndexedAt}` : ''}
        </p>
      )}
      {status?.error && status.enabled && (
        <p className="faint" style={{ marginTop: 6, fontSize: 12 }}>↳ {status.error}</p>
      )}
      {!status?.enabled && status && (
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{status.note}</p>
      )}
      <div className="row" style={{ marginTop: 14, gap: 12, alignItems: 'center' }}>
        <button type="button" className="btn btn--primary" onClick={refresh} disabled={busy}>
          {busy ? 'Checking…' : 'Check health'}
        </button>
        {status?.lastCheckedAt && (
          <span className="muted" style={{ fontSize: 13 }}>
            {status.available ? 'ready' : status.state}
          </span>
        )}
      </div>
      <span className="filechip" style={{ marginTop: 10 }}>{Icon.file} docs/pgvector.md</span>
    </div>
  );
};

const ConnectCognee: React.FC = () => {
  const api = ottoApi();
  const [enabled, setEnabled] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:8000');
  const [health, setHealth] = useState<CogneeHealth | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api?.cognee?.settings) return;
    api.cognee.settings.get().then((s) => {
      setEnabled(s.enabled);
      setBaseUrl(s.baseUrl);
    });
    api.cognee.health().then(setHealth).catch(() => {});
  }, [api]);

  if (!api?.cognee) return null;

  const saveAndCheck = async () => {
    setBusy(true);
    try {
      const next = await api.cognee!.settings.set({
        enabled,
        baseUrl: baseUrl.trim() || 'http://127.0.0.1:8000',
      });
      setHealth(next);
    } finally {
      setBusy(false);
    }
  };

  const healthCode: StatusCode = health?.status === 'ready' ? 'ready' : health?.status === 'disabled' ? 'no-agent' : 'error';

  return (
    <div className="settingsOptionalBlock">
      <div className="settingsOptionalBlock__head">
        <div className="settingsOptionalBlock__title">Cognee</div>
        <StatusPill status={healthCode} />
      </div>
      <p className="settingsOptionalBlock__lede">
        Local loopback sidecar for derived graph recall. Disabled by default — files remain canon.
      </p>
      <div className="grid" style={{ gap: 12, marginTop: 12 }}>
        <label className="row" style={{ gap: 10, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span style={{ fontSize: 13.5 }}>{labsCopy.featureEnableLabel}: Knowledge (Cognee)</span>
        </label>
        <label>
          <span className="faint" style={{ fontSize: 12 }}>Base URL (loopback only)</span>
          <input
            style={inputStyle}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://127.0.0.1:8000"
            spellCheck={false}
            disabled={!enabled}
          />
        </label>
      </div>
      {health?.lastError && enabled && (
        <p className="faint" style={{ marginTop: 8, fontSize: 12 }}>↳ {health.lastError}</p>
      )}
      <div className="row" style={{ marginTop: 14, gap: 12, alignItems: 'center' }}>
        <button type="button" className="btn btn--primary" onClick={saveAndCheck} disabled={busy}>
          {busy ? 'Checking…' : 'Save & check health'}
        </button>
        {health?.lastCheckedAt && (
          <span className="muted" style={{ fontSize: 13 }}>
            {health.status}
            {health.baseUrl ? ` · ${health.baseUrl}` : ''}
          </span>
        )}
      </div>
      <span className="filechip" style={{ marginTop: 10 }}>{Icon.file} docs/cognee.md</span>
    </div>
  );
};

/* ---------- Settings (Setup + Readiness) ---------- */
const SettingsSectionHeader: React.FC<{ title: string; lede: string }> = ({ title, lede }) => (
  <header className="settingsSectionHeader">
    <h2 className="settingsSectionHeader__title">{title}</h2>
    <p className="settingsSectionHeader__lede">{lede}</p>
  </header>
);

const healthStatusTone = (status: HealthCheck['status']): string => {
  if (status === 'ok') return 'connected';
  if (status === 'warn' || status === 'unknown') return 'pending';
  if (status === 'fail') return 'failed';
  return 'draft';
};

const HealthCheckRow: React.FC<{ item: HealthCheck }> = ({ item }) => (
  <div className="settingsReadinessRow">
    <div>
      <div className="settingsReadinessRow__label">{item.label}</div>
      <div className="settingsReadinessRow__detail">{item.summary}</div>
      {item.impact ? (
        <div className="settingsReadinessRow__meta">{settingsCopy.systemHealthImpact}: {item.impact}</div>
      ) : null}
      {item.nextAction ? (
        <div className="settingsReadinessRow__meta">{settingsCopy.systemHealthNext}: {item.nextAction}</div>
      ) : null}
    </div>
    <StatusPill status={healthStatusTone(item.status)} label={item.status} />
  </div>
);

const SystemHealthPanel: React.FC = () => {
  const api = ottoApi();
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!api?.system?.health) return;
    setBusy(true);
    setError(null);
    try {
      setReport(await api.system.health());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [api]);

  if (!api?.system?.health) return null;

  return (
    <>
      <div className="settingsFieldRow">
        <div className="settingsFieldRow__main">
          <div className="settingsFieldRow__title">{settingsCopy.systemHealthTitle}</div>
          <p className="settingsFieldRow__hint">{settingsCopy.systemHealthLede}</p>
        </div>
        <button type="button" className="btn" disabled={busy} onClick={() => void refresh()}>
          {busy ? settingsCopy.systemHealthLoading : settingsCopy.systemHealthRefresh}
        </button>
      </div>
      {error ? <p className="faint settingsStatusBanner settingsStatusBanner--warn">{error}</p> : null}
      {report ? (
        <>
          <div className={`settingsStatusBanner${report.ok ? '' : ' settingsStatusBanner--warn'}`}>
            {report.ok ? settingsCopy.systemHealthOk : settingsCopy.systemHealthNotOk}
            <span className="faint mono" style={{ marginLeft: 8 }}>{report.checkedAt}</span>
          </div>
          <div className="settingsReadinessGroup">
            {report.checks.map((check) => <HealthCheckRow key={check.id} item={check} />)}
          </div>
        </>
      ) : busy ? (
        <p className="faint">{settingsCopy.systemHealthLoading}</p>
      ) : null}
    </>
  );
};

type ProviderKind = 'local' | 'cloud';
const PROVIDER_TABS: Array<{
  kind: ProviderKind;
  label: string;
  tabId: string;
  panelId: string;
}> = [
  { kind: 'local', label: 'Local', tabId: 'provider-tab-local', panelId: 'provider-panel-local' },
  { kind: 'cloud', label: 'Cloud', tabId: 'provider-tab-cloud', panelId: 'provider-panel-cloud' },
];
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
  const [mirror, setMirror] = useState<ProviderMirrorSnapshot | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyMessage, setKeyMessage] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const activeModel = `${rt.status?.modelHandle ?? ''} ${rt.status?.model ?? ''}`.toLowerCase();
  const openLetta = () => void api?.runtime.openLetta();
  const rows = MODEL_PROVIDERS.filter((p) => p.kind === tab);
  const activeProviderTab = PROVIDER_TABS.find((providerTab) => providerTab.kind === tab) ?? PROVIDER_TABS[0];

  const handleProviderTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = PROVIDER_TABS.findIndex((providerTab) => providerTab.kind === tab);
    const currentIndex = activeIndex === -1 ? 0 : activeIndex;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % PROVIDER_TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + PROVIDER_TABS.length) % PROVIDER_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = PROVIDER_TABS.length - 1;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    setTab(PROVIDER_TABS[nextIndex].kind);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  };

  const refreshMirror = () => {
    if (!api?.provider) return;
    api.provider.mirror().then(setMirror).catch(() => setMirror(null));
  };

  useEffect(() => {
    refreshMirror();
  }, [api, rt.status?.ready]);

  const submitApiKey = async () => {
    if (!api?.provider || !apiKeyDraft.trim()) return;
    setKeyBusy(true);
    setKeyMessage(null);
    setKeyError(null);
    try {
      const result = await api.provider.setApiKey(apiKeyDraft);
      setApiKeyDraft('');
      setKeyMessage(result.hasApiKey ? settingsCopy.providerApiKeyPresent : settingsCopy.providerApiKeyMissing);
      refreshMirror();
      const next = await api.runtime.init();
      rt.updateStatus(next);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : String(err));
    } finally {
      setKeyBusy(false);
    }
  };

  return (
    <div className="settingsPage__content providersScreen">
      <SettingsSectionHeader title={settingsCopy.providersTitle} lede={settingsCopy.providersLede} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--primary" onClick={openLetta}>Open Letta</button>
      </div>

      <div className="providersMirror">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className={`pill ${mirror?.lettaConnected ? 'pill--ok' : 'pill--warn'}`}>
            Letta {mirror?.lettaConnected ? 'reachable' : 'not connected'}
          </span>
          <span className={`pill ${mirror?.hasApiKey ? 'pill--ok' : ''}`}>
            {mirror?.hasApiKey ? settingsCopy.providerApiKeyPresent : settingsCopy.providerApiKeyMissing}
          </span>
          {mirror?.modelHandle && <span className="filechip mono">{mirror.modelHandle}</span>}
        </div>
        <p className="settingsFieldHint">{mirror?.note ?? settingsCopy.providerMirrorNote}</p>
        <div className="settingsField">
          <label>
            <span>{settingsCopy.providerSubmitKey}</span>
            <input
              type="password"
              autoComplete="off"
              style={inputStyle}
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder="Paste key once — never shown again"
            />
          </label>
        </div>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <button type="button" className="btn btn--primary" onClick={submitApiKey} disabled={keyBusy || !apiKeyDraft.trim()}>
            {keyBusy ? 'Saving…' : settingsCopy.providerSubmitKey}
          </button>
          {keyMessage && !keyError && <span className="muted" style={{ fontSize: 13 }}>{keyMessage}</span>}
        </div>
        {keyError ? <p className="faint settingsStatusBanner settingsStatusBanner--warn">{keyError}</p> : null}
      </div>

      <div className="segmented" role="tablist" aria-label="Provider type" onKeyDown={handleProviderTabKeyDown}>
        {PROVIDER_TABS.map((providerTab) => (
          <button
            key={providerTab.kind}
            id={providerTab.tabId}
            type="button"
            role="tab"
            aria-selected={tab === providerTab.kind}
            aria-controls={providerTab.panelId}
            tabIndex={tab === providerTab.kind ? 0 : -1}
            className={tab === providerTab.kind ? 'is-active' : ''}
            onClick={() => setTab(providerTab.kind)}
          >
            {providerTab.label}
          </button>
        ))}
      </div>

      <div
        className="providerList"
        id={activeProviderTab.panelId}
        role="tabpanel"
        aria-labelledby={activeProviderTab.tabId}
        tabIndex={0}
      >
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
  const [result, setResult] = useState<MemoryListResult | null>(null);
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
    ? blocks.filter((b: MemoryBlockRecord) =>
      b.label.toLowerCase().includes(query.toLowerCase())
      || b.value.toLowerCase().includes(query.toLowerCase())
      || (b.description?.toLowerCase().includes(query.toLowerCase()) ?? false),
    )
    : blocks;

  return (
    <>
      <div className="row settingsGeneralSection__actions">
        <button type="button" className="btn" onClick={onOpenLetta}>Open in Letta</button>
      </div>
      <p className="settingsFieldHint">
        Inspects Letta core-memory blocks via `{result?.apiPath ?? '/v1/agents/{id}/core-memory/blocks'}`. Otto does not write memory here — use Curation proposals for writeback.
      </p>
        {!connected && (
          <div className="settingsStatusBanner settingsStatusBanner--warn">
            {settingsCopy.memoryConnectWarn}
          </div>
        )}
        {(result?.error || error) && (
          <div className="settingsStatusBanner settingsStatusBanner--warn">
            {result?.error ?? error}
          </div>
        )}
        <input
          className="charterInput settingsGeneralSection__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={settingsCopy.memorySearchPlaceholder}
          disabled={!blocks.length}
          aria-label={settingsCopy.memorySearchPlaceholder}
        />
      {filtered.map((block: MemoryBlockRecord) => (
        <div className="detailSection settingsMemoryBlock" key={block.id}>
          <div className="between">
            <span className="h-sec">{block.label}</span>
            {block.updated_at && <span className="faint mono">{block.updated_at}</span>}
          </div>
          {block.description && <p className="muted settingsMemoryBlock__desc">{block.description}</p>}
          <pre className="mono settingsMemoryBlock__value">{block.value || '(empty)'}</pre>
          {block.limit != null && <span className="filechip settingsMemoryBlock__limit">limit · {block.limit}</span>}
        </div>
      ))}
      {result && !result.error && !filtered.length && (
        <div className="listEmpty"><p className="muted">{settingsCopy.memoryNoMatch}</p></div>
      )}
    </>
  );
};

const DreamSettingsPanel: React.FC<{
  memfsEnabled: boolean;
  pushToast: ReturnType<typeof useToast>['push'];
}> = ({ memfsEnabled, pushToast }) => {
  const [settings, setSettings] = useState<DreamSettings>({ trigger: 'compaction-event', stepCount: 25 });
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stepDraft, setStepDraft] = useState('25');

  useEffect(() => {
    const api = ottoApi();
    if (!api?.dreaming) {
      setHydrated(true);
      return;
    }
    void api.dreaming.get().then((cfg) => {
      setSettings(cfg);
      setStepDraft(String(cfg.stepCount));
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  const persist = async (next: DreamSettings) => {
    const api = ottoApi();
    if (!api?.dreaming || !memfsEnabled) return;
    setBusy(true);
    try {
      const saved = await api.dreaming.set(next);
      setSettings(saved);
      setStepDraft(String(saved.stepCount));
      pushToast({ title: settingsCopy.dreamingSaved, body: `${saved.trigger}${saved.trigger === 'step-count' ? ` · ${saved.stepCount}` : ''}`, tone: 'ok' });
    } finally {
      setBusy(false);
    }
  };

  const onTriggerChange = (trigger: DreamTrigger) => {
    const next = { ...settings, trigger };
    setSettings(next);
    void persist(next);
  };

  const commitStepCount = () => {
    const parsed = Number.parseInt(stepDraft.trim(), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setStepDraft(String(settings.stepCount));
      return;
    }
    const next = { ...settings, stepCount: parsed };
    setSettings(next);
    void persist(next);
  };

  return (
    <>
      {!memfsEnabled && (
        <div className="settingsStatusBanner settingsStatusBanner--warn">
          {settingsCopy.dreamingMemfsWarn}
        </div>
      )}
      <div className="settingsFieldRow">
        <div className="settingsFieldRow__main">
          <div className="settingsFieldRow__title">{settingsCopy.dreamingTriggerLabel}</div>
          <p className="settingsFieldRow__hint">{settingsCopy.dreamingLede}</p>
        </div>
        <select
          className="charterInput"
          value={settings.trigger}
          disabled={!hydrated || busy || !memfsEnabled}
          aria-label={settingsCopy.dreamingTriggerLabel}
          onChange={(e) => onTriggerChange(e.target.value as DreamTrigger)}
        >
          <option value="off">{settingsCopy.dreamingTriggerOff}</option>
          <option value="step-count">{settingsCopy.dreamingTriggerStepCount}</option>
          <option value="compaction-event">{settingsCopy.dreamingTriggerCompaction}</option>
        </select>
      </div>
      {settings.trigger === 'step-count' && (
        <div className="settingsFieldRow">
          <div className="settingsFieldRow__main">
            <div className="settingsFieldRow__title">{settingsCopy.dreamingStepCountLabel}</div>
            <p className="settingsFieldRow__hint">{settingsCopy.dreamingStepCountHint}</p>
          </div>
          <input
            className="charterInput mono"
            type="number"
            min={1}
            step={1}
            value={stepDraft}
            disabled={!hydrated || busy || !memfsEnabled}
            aria-label={settingsCopy.dreamingStepCountLabel}
            onChange={(e) => setStepDraft(e.target.value)}
            onBlur={() => commitStepCount()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitStepCount();
            }}
          />
        </div>
      )}
    </>
  );
};

const DisplaySettingsPanel: React.FC = () => {
  const api = ottoApi();
  const [theme, setTheme] = useState<DisplayTheme>(() => readStoredDisplayTheme());

  useEffect(() => {
    if (!api) return;
    void api.config.get().then((cfg) => {
      if (!cfg.theme) return;
      setTheme(cfg.theme);
      persistDisplayTheme(cfg.theme);
    }).catch(() => {});
  }, [api]);

  useEffect(() => watchSystemDisplayTheme(theme), [theme]);

  const updateTheme = async (next: DisplayTheme) => {
    setTheme(next);
    persistDisplayTheme(next);
    if (api) {
      try {
        await api.config.set({ theme: next });
      } catch {
        /* best effort */
      }
    }
  };

  return (
    <div className="settingsBlock">
      <div className="settingsField">
        <label>
          <span>{settingsCopy.displayThemeLabel}</span>
          <select
            style={inputStyle}
            value={theme}
            onChange={(e) => void updateTheme(e.target.value as DisplayTheme)}
            aria-label={settingsCopy.displayThemeLabel}
          >
            <option value="light">{settingsCopy.displayThemeLight}</option>
            <option value="dark">{settingsCopy.displayThemeDark}</option>
            <option value="system">{settingsCopy.displayThemeSystem}</option>
          </select>
        </label>
        <p className="settingsFieldHint">{settingsCopy.displayThemeHint}</p>
      </div>
    </div>
  );
};

const LabsSettingsPanel: React.FC = () => {
  const { labs, setMasterEnabled, setFeatureEnabled, hydrated } = useLabs();

  return (
    <>
      <div className="settingsLabsWarn">{settingsCopy.labsWarn}</div>
      <div className="settingsFieldRow">
        <div className="settingsFieldRow__main">
          <div className="settingsFieldRow__title">{labsCopy.masterLabel}</div>
          <p className="settingsFieldRow__hint">{labsCopy.masterWarning}</p>
        </div>
        <label className="labsRow__toggle">
          <input
            type="checkbox"
            checked={labs.enabled === true}
            disabled={!hydrated}
            onChange={(e) => void setMasterEnabled(e.target.checked)}
          />
        </label>
      </div>
      <div className="labsList" style={{ marginTop: 0 }}>
        {LAB_FEATURE_IDS.map((id: LabFeatureId) => {
          const meta = LAB_FEATURE_META[id];
          const enabled = labs.features?.[id] === true;
          return (
            <div key={id} className="settingsFieldRow">
              <div className="settingsFieldRow__main">
                <div className="settingsFieldRow__title">
                  {meta.label}
                  <span className="pill">{labsCopy.previewBadge}</span>
                </div>
                <p className="settingsFieldRow__hint">{meta.blurb}</p>
              </div>
              <label className="labsRow__toggle">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={!hydrated || labs.enabled !== true}
                  onChange={(e) => void setFeatureEnabled(id, e.target.checked)}
                />
              </label>
            </div>
          );
        })}
      </div>
      <p className="faint mono settingsLabsFootnote">{labsCopy.matrixLink}</p>
    </>
  );
};

const ConversationSortSetting: React.FC = () => {
  const api = ottoApi();
  const [mode, setMode] = useState<ConversationSortMode>('recent');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api?.config?.get) return;
    void api.config.get().then((cfg) => {
      setMode(cfg.conversationSortMode === 'created' ? 'created' : 'recent');
    });
  }, [api]);

  const save = async (next: ConversationSortMode) => {
    if (!api?.config?.set || busy) return;
    setBusy(true);
    try {
      await api.config.set({ conversationSortMode: next });
      setMode(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settingsFieldRow">
      <div className="settingsFieldRow__main">
        <div className="settingsFieldRow__title">{settingsCopy.conversationSortLabel}</div>
        <p className="settingsFieldRow__hint">{settingsCopy.conversationSortHint}</p>
      </div>
      <select
        className="charterInput"
        value={mode}
        disabled={busy || !api}
        aria-label={settingsCopy.conversationSortLabel}
        onChange={(event) => void save(event.target.value as ConversationSortMode)}
      >
        <option value="recent">{settingsCopy.conversationSortRecent}</option>
        <option value="created">{settingsCopy.conversationSortCreated}</option>
      </select>
    </div>
  );
};

type SettingsSectionId = 'general' | 'display' | 'providers' | 'memory' | 'culture' | 'labs';

export const Settings: React.FC = () => {
  const rt = useRuntimeContext();
  const api = ottoApi();
  const { push: pushToast } = useToast();
  const [section, setSection] = useState<SettingsSectionId>('general');
  const [buildInfo, setBuildInfo] = useState<AppBuildInfo | null>(null);

  useEffect(() => {
    if (!api?.app?.buildInfo) return;
    void api.app.buildInfo().then(setBuildInfo).catch(() => setBuildInfo(null));
  }, [api]);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('otto.settings.section');
      if (
        pending === 'general'
        || pending === 'display'
        || pending === 'providers'
        || pending === 'memory'
        || pending === 'culture'
        || pending === 'labs'
      ) {
        setSection(pending);
        sessionStorage.removeItem('otto.settings.section');
      }
    } catch { /* best effort */ }
  }, []);

  const liveConnected = rt.electron && !!rt.status?.ready;

  const settingsTabs: Array<{ id: SettingsSectionId; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: settingsCopy.tabGeneral, icon: Icon.settings },
    { id: 'display', label: settingsCopy.tabDisplay, icon: Icon.theme },
    { id: 'providers', label: settingsCopy.tabProviders, icon: Icon.lock },
    { id: 'memory', label: settingsCopy.tabMemory, icon: Icon.curation },
    { id: 'culture', label: settingsCopy.tabCulture, icon: Icon.file },
    { id: 'labs', label: settingsCopy.tabLabs, icon: Icon.theme },
  ];

  return (
    <SurfacePage className="settingsSurface">
      <SurfaceHero
        eyebrow={settingsCopy.eyebrow}
        title={settingsCopy.pageTitle}
        lede={settingsCopy.pageLede}
      />
      <div className="settingsPage">
      <nav className="settingsTabs" role="tablist" aria-label="Settings sections">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={section === tab.id}
            className={section === tab.id ? 'is-active' : ''}
            onClick={() => setSection(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {section === 'providers' ? (
        <ModelProviders />
      ) : section === 'display' ? (
        <div className="settingsPage__content">
          <SettingsSectionHeader title={settingsCopy.displayTitle} lede={settingsCopy.displayLede} />
          <DisplaySettingsPanel />
          <p className="faint mono settingsLocalFootnote">{settingsCopy.localOnlyFootnote}</p>
          <AppSourceDetails info={buildInfo} />
        </div>
      ) : section === 'memory' ? (
        <div className="settingsPage__content">
          <section id="settings-memory">
            <SettingsSectionHeader title={settingsCopy.memoryTitle} lede={settingsCopy.memoryLede} />
            <MemoryObservatory connected={liveConnected} onOpenLetta={() => void ottoApi()?.runtime.openLetta()} />
          </section>
          <p className="faint mono settingsLocalFootnote">{settingsCopy.localOnlyFootnote}</p>
          <AppSourceDetails info={buildInfo} />
        </div>
      ) : section === 'culture' ? (
        <div className="settingsPage__content">
          <section id="settings-culture">
            {api ? (
              <CultureSettingsPanel api={api} pushToast={pushToast} />
            ) : (
              <InlineEmpty title={cultureSettingsCopy.title} body={cultureSettingsCopy.lede} />
            )}
          </section>
          <p className="faint mono settingsLocalFootnote">{settingsCopy.localOnlyFootnote}</p>
          <AppSourceDetails info={buildInfo} />
        </div>
      ) : section === 'labs' ? (
        <div className="settingsPage__content">
          <section className="settingsLabs" id="settings-labs">
            <SettingsSectionHeader title={settingsCopy.sectionLabs} lede={labsCopy.lede} />
            <LabsSettingsPanel />
          </section>
          <p className="faint mono settingsLocalFootnote">{settingsCopy.localOnlyFootnote}</p>
          <AppSourceDetails info={buildInfo} />
        </div>
      ) : (
        <div className="settingsPage__content">
          <SettingsSectionHeader title={settingsCopy.generalTitle} lede={settingsCopy.generalLede} />

          <section>
            <SettingsSectionHeader title={settingsCopy.connectionTitle} lede={settingsCopy.connectionLede} />
            <ConnectLetta />
          </section>

          <section>
            <SettingsSectionHeader title={settingsCopy.advancedAgentsTitle} lede={settingsCopy.advancedAgentsLede} />
            <IsolatedAgentPanel />
          </section>

          <section>
            <SettingsSectionHeader title={settingsCopy.workspaceTitle} lede={settingsCopy.workspaceLede} />
            <WorkspaceAndPermissionRoute />
          </section>

          <section>
            <SettingsSectionHeader title={settingsCopy.conversationSortLabel} lede={settingsCopy.conversationSortHint} />
            <ConversationSortSetting />
          </section>

          {(api?.cognee || api?.pgvector) ? (
            <section>
              <SettingsSectionHeader title={settingsCopy.optionalRecallTitle} lede={settingsCopy.optionalRecallLede} />
              <ConnectCognee />
              <ConnectPgvector />
            </section>
          ) : null}

          <section>
            <SettingsSectionHeader title={settingsCopy.onboardingTitle} lede={settingsCopy.onboardingLede} />
            <div className="settingsFieldRow">
              <div className="settingsFieldRow__main">
                <div className="settingsFieldRow__title">{settingsCopy.onboardingReplayTitle}</div>
                <p className="settingsFieldRow__hint">{settingsCopy.onboardingReplayHint}</p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetOnboardingForReplay();
                  pushToast({
                    title: settingsCopy.onboardingResetToastTitle,
                    body: settingsCopy.onboardingResetToastBody,
                    tone: 'ok',
                  });
                }}
              >
                {settingsCopy.onboardingReset}
              </button>
            </div>
          </section>

          <section>
            <SettingsSectionHeader title={settingsCopy.systemHealthTitle} lede={settingsCopy.systemHealthLede} />
            <SystemHealthPanel />
          </section>

          <section>
            <SettingsSectionHeader title={settingsCopy.readinessTitle} lede={settingsCopy.readinessLede} />
            <ReadinessPanel />
          </section>

          <section className="settingsGeneralSection" id="settings-dreaming">
            <SettingsSectionHeader title={settingsCopy.dreamingTitle} lede={settingsCopy.dreamingLede} />
            <DreamSettingsPanel memfsEnabled={!!rt.status?.memfsEnabled} pushToast={pushToast} />
          </section>

          {api ? (
            <section className="settingsGeneralSection" id="settings-diagnostics">
              <DiagnosticsSettingsPanel api={api} pushToast={pushToast} />
            </section>
          ) : null}

          <p className="faint mono settingsLocalFootnote">{settingsCopy.localOnlyFootnote}</p>
          <AppSourceDetails info={buildInfo} />
        </div>
      )}
      </div>
      <SurfaceProof surface="settings" />
    </SurfacePage>
  );
};

const DiagnosticsSettingsPanel: React.FC<{
  api: NonNullable<ReturnType<typeof ottoApi>>;
  pushToast: ReturnType<typeof useToast>['push'];
}> = ({ api, pushToast }) => {
  const [bundlePath, setBundlePath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportDiagnostics = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.diagnostics.export();
      setBundlePath(result.bundlePath);
      await api.diagnostics.reveal(result.bundlePath);
      pushToast({
        title: settingsCopy.diagnosticsExportDone,
        body: result.bundlePath,
        tone: 'ok',
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SettingsSectionHeader title={settingsCopy.diagnosticsTitle} lede={settingsCopy.diagnosticsLede} />
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn btn--solid-d" disabled={busy} onClick={() => void exportDiagnostics()}>
          {settingsCopy.diagnosticsExport}
        </button>
      </div>
      {bundlePath ? <p className="mono faint" style={{ fontSize: 11.5 }}>{bundlePath}</p> : null}
      <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>{settingsCopy.diagnosticsCommand}</p>
      {error ? <p className="faint" style={{ color: 'var(--warn)' }}>{error}</p> : null}
    </>
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
    <>
      <SettingsSectionHeader title={cultureSettingsCopy.title} lede={cultureSettingsCopy.lede} />
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn" disabled={busy} onClick={() => void api.constitution.open()}>
          {cultureSettingsCopy.openConstitution}
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => void exportCulture()}>
          {cultureSettingsCopy.exportCulture}
        </button>
      </div>
      {bundlePath ? <p className="mono faint" style={{ fontSize: 11.5 }}>{bundlePath}</p> : null}
      <div className="settingsField" style={{ marginTop: 8 }}>
        <span>{cultureSettingsCopy.amendTitle}</span>
        <textarea
          className="mono"
          rows={14}
          value={yamlDraft}
          onChange={(e) => setYamlDraft(e.target.value)}
          disabled={busy}
          style={{ width: '100%' }}
        />
        <button type="button" className="btn btn--solid-d" style={{ marginTop: 12 }} disabled={busy} onClick={() => void amend()}>
          {cultureSettingsCopy.amendSave}
        </button>
      </div>
      <div className="settingsField">
        <span>{cultureSettingsCopy.importPreview}</span>
        <input
          type="text"
          className="mono"
          placeholder="Path to otto-culture-export-….zip"
          value={importPath}
          onChange={(e) => setImportPath(e.target.value)}
          disabled={busy}
          style={{ width: '100%' }}
        />
        <button type="button" className="btn" style={{ marginTop: 12 }} disabled={busy || !importPath.trim()} onClick={() => void previewImport()}>
          Preview import (dry-run)
        </button>
        {importPreview ? <pre className="receiptJson mono" style={{ marginTop: 12 }}>{importPreview}</pre> : null}
      </div>
      {error ? <div className="settingsStatusBanner settingsStatusBanner--warn">{error}</div> : null}
    </>
  );
};
