import React from 'react';

/** Hero band — one-pager scale title + optional proof line. */
export const SurfaceHero: React.FC<{
  eyebrow: string;
  title: string;
  lede?: string;
  proof?: string;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, lede, proof, actions }) => (
  <header className="surfaceHero">
    <div className="between">
      <div className="eyebrow">{eyebrow}</div>
      {actions}
    </div>
    <h1 className="surfaceHero__title">{title}</h1>
    {lede ? <p className="surfaceHero__lede">{lede}</p> : null}
    {proof ? (
      <p className="surfaceHero__proof">
        <strong>The test:</strong> {proof}
      </p>
    ) : null}
  </header>
);

/** Single ink moment per surface — matches one-pager dark block. */
export const InkBlock: React.FC<{ headline: React.ReactNode; sub?: string }> = ({ headline, sub }) => (
  <div className="inkBlock">
    <div className="inkBlock__headline">{headline}</div>
    {sub ? <p className="inkBlock__sub">{sub}</p> : null}
  </div>
);

/** Ink moment from lead + muted tail — matches one-pager HTML. */
export const SurfaceInk: React.FC<{ lead: string; muted: string; sub?: string }> = ({ lead, muted, sub }) => (
  <InkBlock
    headline={
      <>
        {lead} <span className="inkBlock__muted">{muted}</span>
      </>
    }
    sub={sub}
  />
);

export const SurfaceStatStrip: React.FC<{
  stats: ReadonlyArray<{ label: string; value: number | string; tone?: 'ok' | 'warn' | 'neutral' }>;
}> = ({ stats }) => (
  <div className="surfaceStatStrip" role="list">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className={`surfaceStatStrip__item${stat.tone ? ` surfaceStatStrip__item--${stat.tone}` : ''}`}
        role="listitem"
      >
        <span className="surfaceStatStrip__value">{stat.value}</span>
        <span className="surfaceStatStrip__label">{stat.label}</span>
      </div>
    ))}
  </div>
);

/** Collapsed paths / schema — operator story stays above the fold. */
export const SurfaceMeta: React.FC<{ label?: string; children: React.ReactNode }> = ({ label = 'Storage', children }) => (
  <details className="surfaceMeta">
    <summary>{label}</summary>
    <div className="surfaceMeta__body">{children}</div>
  </details>
);

export const SurfaceHeader: React.FC<{
  eyebrow: string;
  title: string;
  lede?: string;
  tag?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ eyebrow, title, lede, tag, actions, children }) => (
  <div className="panel surfaceHeader">
    <div className="between">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <div className="h-sec">{title}</div>
      </div>
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        {tag}
        {actions}
      </div>
    </div>
    {lede ? <p className="lede" style={{ marginTop: 8 }}>{lede}</p> : null}
    {children}
  </div>
);

export const SurfacePage: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`standardsSurface surfacePage${className ? ` ${className}` : ''}`}>{children}</div>;

export const SplitLayout: React.FC<{
  list: React.ReactNode;
  detail: React.ReactNode;
  listClassName?: string;
  listAriaLabel?: string;
}> = ({ list, detail, listClassName = '', listAriaLabel }) => (
  <div className="split">
    <div
      className={`cards${listClassName ? ` ${listClassName}` : ''}`}
      {...(listAriaLabel ? { role: 'group' as const, 'aria-label': listAriaLabel } : {})}
    >
      {list}
    </div>
    {detail}
  </div>
);

export const FilterBar: React.FC<{
  options: ReadonlyArray<{ key: string; label: string }>;
  active: string;
  onSelect: (key: string) => void;
}> = ({ options, active, onSelect }) => (
  <div className="row filterBar" role="tablist">
    {options.map((opt) => (
      <button
        key={opt.key}
        type="button"
        role="tab"
        aria-selected={active === opt.key}
        className={`btn${active === opt.key ? ' btn--primary' : ''}`}
        onClick={() => onSelect(opt.key)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
