import type React from 'react';
import { Icon } from './components/icons';
import { readyStatusPill } from './components/ui';
import { settingsCopy } from './copy/surfaces';
import { useRuntimeContext } from './runtime-context';
import { readiness, requiredMissing, type ReadyItem } from './readiness';

const ReadyRow: React.FC<{ item: ReadyItem }> = ({ item }) => (
  <div className="settingsReadinessRow">
    <div>
      <div className="settingsReadinessRow__label">
        {item.label}
        {item.required ? <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}> · required</span> : null}
      </div>
      <div className="settingsReadinessRow__detail">{item.detail}</div>
      {item.source ? <span className="filechip" style={{ marginTop: 8 }}>{Icon.file} {item.source}</span> : null}
      <div className="settingsReadinessRow__meta">↳ {item.action}</div>
    </div>
    {readyStatusPill(item.status)}
  </div>
);

function liveRuntimeRows(model: string | undefined, memfsEnabled: boolean | undefined, toolCount: number): ReadyItem[] {
  return [
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
      detail: 'Letta session active',
      source: 'RuntimeStatus',
      action: 'Resolved from the live Letta session',
    },
    {
      key: 'model',
      label: 'Model provider',
      required: false,
      status: 'connected',
      detail: model ?? 'owned by live Letta runtime',
      source: 'RuntimeStatus',
      action: 'Configure providers in Letta Desktop / Letta local runtime',
    },
    {
      key: 'memory',
      label: 'Memory / MemFS',
      required: true,
      status: memfsEnabled ? 'connected' : 'configured',
      detail: memfsEnabled ? 'MemFS enabled by live runtime' : 'Connected through live runtime; MemFS not enabled',
      source: 'RuntimeStatus',
      action: memfsEnabled ? 'Available in the initialized session' : 'Enable OTTO_MEMFS=1 only for backends that support it',
    },
    {
      key: 'functions',
      label: 'Runtime tools',
      required: false,
      status: toolCount > 0 ? 'configured' : 'not-wired',
      detail: `${toolCount} tool${toolCount === 1 ? '' : 's'} available`,
      source: 'RuntimeStatus',
      action: 'Forwarded by the initialized Letta session',
    },
  ];
}

export function useReadinessView() {
  const rt = useRuntimeContext();
  const loading = rt.electron && rt.status === null;
  const liveConnected = rt.electron && !!rt.status?.ready;
  const liveRows = liveConnected
    ? liveRuntimeRows(rt.status?.model, rt.status?.memfsEnabled, rt.status?.tools?.length ?? 0)
    : [];
  const liveByKey = new Map(liveRows.map((row) => [row.key, row]));
  const ready = liveConnected || requiredMissing.length === 0;
  const group = (keys: string[]) =>
    readiness.filter((row) => keys.includes(row.key)).map((row) => liveByKey.get(row.key) ?? row);

  const banner = loading
    ? settingsCopy.readinessChecking
    : liveConnected
      ? `${settingsCopy.readinessConnected}${rt.status?.model ? ` · ${rt.status.model}` : ''}`
      : ready
        ? settingsCopy.readinessReadyFallback
        : `${settingsCopy.readinessNotReady} ${requiredMissing.map((row) => row.label).join(' · ')}`;

  return { loading, liveConnected, ready, banner, group };
}

type ReadinessPanelProps = {
  variant?: 'settings' | 'onboarding';
};

export const ReadinessPanel: React.FC<ReadinessPanelProps> = ({ variant = 'settings' }) => {
  const { loading, liveConnected, ready, banner, group } = useReadinessView();

  if (loading) {
    return (
      <div className="onboardReadiness onboardReadiness--loading" aria-live="polite">
        <p className="onboardReadiness__checking">{settingsCopy.readinessChecking}</p>
      </div>
    );
  }

  const runtimeKeys = ['runtime', 'agent', 'model', 'memory', 'workspace'] as const;
  const capabilityKeys = ['skills', 'practices', 'mcp', 'functions', 'permissions'] as const;
  const surfaceKeys = ['charters', 'standards', 'routines', 'curation', 'receipts', 'autonomy', 'knowledge', 'tickets', 'channels'] as const;

  if (variant === 'onboarding') {
    return (
      <div className="onboardReadiness" aria-live="polite">
        <div className={`settingsStatusBanner onboardReadiness__banner${!ready && !liveConnected ? ' settingsStatusBanner--warn' : ''}`}>
          {banner}
        </div>
        <div className="settingsReadinessGroup onboardReadiness__rows">
          <div className="faint settingsReadinessGroup__label">{settingsCopy.readinessGroupRuntime}</div>
          {group([...runtimeKeys]).map((row) => <ReadyRow key={row.key} item={row} />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`settingsStatusBanner${!ready && !liveConnected ? ' settingsStatusBanner--warn' : ''}`}>
        {banner}
      </div>
      <details className="settingsReadinessDetails">
        <summary>{settingsCopy.readinessDetail}</summary>
        <div className="settingsReadinessGroup">
          <div className="faint settingsReadinessGroup__label">{settingsCopy.readinessGroupRuntime}</div>
          {group([...runtimeKeys]).map((row) => <ReadyRow key={row.key} item={row} />)}
        </div>
        <div className="settingsReadinessGroup">
          <div className="faint settingsReadinessGroup__label">{settingsCopy.readinessGroupCapabilities}</div>
          {group([...capabilityKeys]).map((row) => <ReadyRow key={row.key} item={row} />)}
        </div>
        <div className="settingsReadinessGroup">
          <div className="faint settingsReadinessGroup__label">{settingsCopy.readinessGroupSurfaces}</div>
          {group([...surfaceKeys]).map((row) => <ReadyRow key={row.key} item={row} />)}
        </div>
      </details>
    </>
  );
};
