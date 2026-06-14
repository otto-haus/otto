import { useEffect, useState } from 'react';
import type { AppBuildInfo } from '../../electron/shared/types';
import { ottoApi } from '../runtime';

export function AppSourceBadge({ compact = false }: { compact?: boolean }) {
  const [info, setInfo] = useState<AppBuildInfo | null>(null);

  useEffect(() => {
    const api = ottoApi();
    if (!api?.app?.buildInfo) return;
    void api.app.buildInfo().then(setInfo).catch(() => setInfo(null));
  }, []);

  if (!info?.shortSha && !info?.channel) return null;

  const channel = info.channel ?? 'dev';
  const behindMain = info.channel === 'staging' && info.matchesMain === false;
  const label = compact
    ? `${channel} · ${info.shortSha ?? '?'}${behindMain ? ' · behind main' : ''}`
    : `${channel} · ${info.shortSha ?? '?'}${info.version ? ` · v${info.version}` : ''}${behindMain ? ' · not latest main' : ''}`;

  return (
    <span
      className={`pill appSourceBadge${behindMain ? ' pill--warn' : channel === 'staging' ? ' pill--staging' : ''}`}
      data-testid="otto-source-marker"
      title={buildTitle(info)}
    >
      {label}
    </span>
  );
}

function buildTitle(info: AppBuildInfo): string {
  const lines = [
    info.channel ? `Channel: ${info.channel}` : null,
    info.version ? `Version: ${info.version}` : null,
    info.shortSha ? `Commit: ${info.shortSha}` : null,
    info.branch ? `Branch: ${info.branch}` : null,
    info.builtAt ? `Built: ${info.builtAt}` : null,
    info.mainShortSha ? `origin/main: ${info.mainShortSha}` : null,
    info.matchesMain === false ? 'Build is not at origin/main' : null,
    info.appPath ? `App: ${info.appPath}` : null,
    info.profilePath ? `Profile: ${info.profilePath}` : null,
    info.homePath ? `Otto home: ${info.homePath}` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

export function AppSourceDetails({ info }: { info: AppBuildInfo | null }) {
  if (!info?.shortSha && !info?.channel) return null;
  return (
    <div className="settingsSourceDetails" data-testid="otto-source-details otto-build-marker">
      <p className="faint mono settingsLocalFootnote">
        {info.channel ? `${info.channel}` : 'unknown channel'}
        {info.version ? ` · v${info.version}` : ''}
        {info.shortSha ? ` · ${info.shortSha}` : ''}
        {info.builtAt ? ` · ${info.builtAt}` : ''}
        {info.branch ? ` · ${info.branch}` : ''}
      </p>
      {info.mainShortSha ? (
        <p className={`faint mono settingsLocalFootnote${info.matchesMain === false ? ' settingsLocalFootnote--warn' : ''}`}>
          origin/main {info.mainShortSha}
          {info.matchesMain === false ? ' · staging build is not latest main' : info.matchesMain ? ' · matches build' : ''}
        </p>
      ) : null}
      {info.appPath ? <p className="faint mono settingsLocalFootnote">App {info.appPath}</p> : null}
      {info.profilePath ? <p className="faint mono settingsLocalFootnote">Profile {info.profilePath}</p> : null}
      {info.homePath ? <p className="faint mono settingsLocalFootnote">Otto home {info.homePath}</p> : null}
    </div>
  );
}
