import type React from 'react';

export type PaneLoadingVariant = 'list' | 'detail' | 'rows' | 'inline';

const LoadingDots: React.FC = () => (
  <span className="paneLoading__dots" aria-hidden="true">
    <i /><i /><i />
  </span>
);

export const PaneLoading: React.FC<{
  label: string;
  variant?: PaneLoadingVariant;
  className?: string;
}> = ({ label, variant = 'list', className }) => (
  <div
    className={`paneLoading paneLoading--${variant}${className ? ` ${className}` : ''}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={label}
  >
    <p className="paneLoading__label">
      {label}
      <LoadingDots />
    </p>
    {variant === 'list' ? (
      <div className="paneLoading__list" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div className="paneLoading__card" key={index}>
            <div className="paneLoading__line paneLoading__line--title" />
            <div className="paneLoading__line paneLoading__line--sub" />
          </div>
        ))}
      </div>
    ) : null}
    {variant === 'detail' ? (
      <div className="paneLoading__detail" aria-hidden="true">
        <div className="paneLoading__line paneLoading__line--title" />
        <div className="paneLoading__line paneLoading__line--wide" />
        <div className="paneLoading__line paneLoading__line--sub" />
      </div>
    ) : null}
    {variant === 'rows' ? (
      <div className="paneLoading__rows" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div className="paneLoading__row" key={index}>
            <div className="paneLoading__rowMain">
              <div className="paneLoading__line paneLoading__line--title" />
              <div className="paneLoading__line paneLoading__line--sub" />
            </div>
            <div className="paneLoading__pill" />
          </div>
        ))}
      </div>
    ) : null}
  </div>
);
