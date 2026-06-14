import React from 'react';

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

export const SplitLayout: React.FC<{ list: React.ReactNode; detail: React.ReactNode }> = ({ list, detail }) => (
  <div className="split">
    <div className="cards">{list}</div>
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
