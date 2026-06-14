import React, { useEffect, useState } from 'react';
import type { Check, CheckListResult, CheckRunStats } from '@otto-haus/core';
import { Icon } from '../components/icons';
import {
  InlineEmpty,
  SplitLayout,
  SurfaceHero,
  SurfaceInk,
  SurfaceMeta,
  SurfacePage,
  SurfaceProof,
  SurfaceStatStrip,
  WebPreviewFrame,
} from '../components/ui';
import { checksCopy, cultureCiCopy, listEmpty } from '../copy/surfaces';
import { ottoApi } from '../runtime';

function triggerLabel(event: Check['trigger']['event']): string {
  return event === 'done_claim' ? 'done claim' : 'one-way door';
}

function formatLastRun(stats: CheckRunStats | undefined): { label: string; tone: 'ok' | 'warn' | 'neutral' } {
  if (!stats?.last_run_at) {
    return { label: checksCopy.lastRunNone, tone: 'neutral' };
  }
  const when = new Date(stats.last_run_at).toLocaleString();
  const outcome = stats.last_passed ? checksCopy.lastRunPass : checksCopy.lastRunFail;
  return {
    label: `${when} · ${outcome}`,
    tone: stats.last_passed ? 'ok' : 'warn',
  };
}

function runCountLabel(stats: CheckRunStats | undefined): string {
  if (!stats || (stats.pass_count === 0 && stats.fail_count === 0)) {
    return checksCopy.lastRunNone;
  }
  return `${stats.pass_count} pass / ${stats.fail_count} fail`;
}

export const ChecksSurfaceShell: React.FC = () => {
  const api = ottoApi();
  const [result, setResult] = useState<CheckListResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.checks
      .list()
      .then((next) => {
        if (cancelled) return;
        setResult(next);
        setSelectedId(next.checks[0]?.id ?? null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (!api) {
    return <WebPreviewFrame surface="checks" />;
  }

  const checks = result?.checks ?? [];
  const stats = result?.stats ?? {};
  const selected = checks.find((check) => check.id === selectedId) ?? checks[0] ?? null;
  const selectedStats = selected ? stats[selected.id] : undefined;
  const doneClaimCount = checks.filter((c) => c.trigger.event === 'done_claim').length;
  const doorCount = checks.filter((c) => c.trigger.event === 'one_way_door_action').length;

  return (
    <SurfacePage>
      <SurfaceHero
        eyebrow={checksCopy.eyebrow}
        title={checksCopy.title}
        lede={checksCopy.lede}
      />
      <SurfaceInk lead={checksCopy.inkLead} muted={checksCopy.inkMuted} sub={cultureCiCopy.blockHint} />
      <SurfaceStatStrip
        stats={[
          { label: checksCopy.statActive, value: checks.length },
          { label: checksCopy.statDoneClaim, value: doneClaimCount, tone: doneClaimCount ? 'ok' : 'neutral' },
          { label: checksCopy.statOneWayDoor, value: doorCount, tone: doorCount ? 'warn' : 'neutral' },
        ]}
      />
      {error && (
        <div className="notice">
          <span className="dot dot--warn" /> {error}
        </div>
      )}
      {(result?.skipped.length ?? 0) > 0 && (
        <div className="notice">
          <span className="dot dot--warn" />
          {result!.skipped.length} check file(s) skipped during load.
        </div>
      )}
      {!result && !error && (
        <div className="detailSection">
          <div className="h-sec">{checksCopy.loadingTitle}</div>
        </div>
      )}
      {result && !checks.length && !error && (
        <InlineEmpty title={listEmpty.checks?.title ?? checksCopy.emptyTitle} body={listEmpty.checks?.body ?? checksCopy.emptyBody} />
      )}
      {checks.length > 0 && (
        <SplitLayout
          list={checks.map((check) => {
            const checkStats = stats[check.id];
            const lastRun = formatLastRun(checkStats);
            return (
            <button
              key={check.id}
              type="button"
              className={`card${check.id === selected?.id ? ' is-selected' : ''}`}
              onClick={() => setSelectedId(check.id)}
            >
              <div className="between">
                <span className="card__title">{check.id}</span>
                <span className="pill pill--info">{triggerLabel(check.trigger.event)}</span>
              </div>
              <span className="card__sub">{check.source}</span>
              <div className="row" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                <span className={`pill ${lastRun.tone === 'ok' ? 'pill--ok' : lastRun.tone === 'warn' ? 'pill--warn' : ''}`}>
                  {checksCopy.statLastRun}: {lastRun.label}
                </span>
              </div>
            </button>
            );
          })}
          detail={
            selected ? (
              <div className="detail">
                <div className="detailSection">
                  <div className="between">
                    <div className="h-sec">{selected.id}</div>
                    <span className={`pill ${selected.active !== false ? 'pill--ok' : 'pill--warn'}`}>
                      v{selected.version}
                    </span>
                  </div>
                  <p className="lede" style={{ marginTop: 8 }}>{selected.on_fail.message}</p>
                  <div className="receiptEvidence" style={{ marginTop: 12 }}>
                    <div className="zone receiptEvidenceRow">
                      <span className="zone__tag">{checksCopy.zoneTrigger}</span>
                      <div>{triggerLabel(selected.trigger.event)}</div>
                    </div>
                    <div className="zone receiptEvidenceRow">
                      <span className="zone__tag">{checksCopy.zoneSource}</span>
                      <div className="mono">{selected.source}</div>
                    </div>
                    <div className="zone receiptEvidenceRow">
                      <span className="zone__tag">{checksCopy.zoneInspect}</span>
                      <div>{selected.inspect.require.join(', ')}</div>
                    </div>
                    {selected.compiled_from_proposal_id ? (
                      <div className="zone receiptEvidenceRow">
                        <span className="zone__tag">{checksCopy.zoneCompiled}</span>
                        <div className="mono">{selected.compiled_from_proposal_id}</div>
                      </div>
                    ) : null}
                    {selected.compiled_at ? (
                      <div className="zone receiptEvidenceRow">
                        <span className="zone__tag">{checksCopy.zoneCompiledAt}</span>
                        <div className="mono">{selected.compiled_at}</div>
                      </div>
                    ) : null}
                    {selected.standard_slug ? (
                      <div className="zone receiptEvidenceRow">
                        <span className="zone__tag">{checksCopy.zoneStandard}</span>
                        <div className="mono">{selected.standard_slug}</div>
                      </div>
                    ) : null}
                    <div className="zone receiptEvidenceRow">
                      <span className="zone__tag">{checksCopy.statLastRun}</span>
                      <div>{formatLastRun(selectedStats).label}</div>
                    </div>
                    <div className="zone receiptEvidenceRow">
                      <span className="zone__tag">{checksCopy.runCounts}</span>
                      <div>{runCountLabel(selectedStats)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          }
        />
      )}
      <SurfaceMeta label={checksCopy.metaLabel}>
        <span className="filechip">{Icon.file} {result?.dir ?? '~/.otto/checks/'}</span>
        {selected && <span className="filechip">{selected.source}</span>}
      </SurfaceMeta>
      <SurfaceProof surface="checks" />
    </SurfacePage>
  );
};
