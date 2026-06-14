import React from 'react';
import { checksCopy } from '../../copy/surfaces';

/** Inline Culture CI block banner — shown in Chat when a check blocks a done claim or one-way door. */
export const CheckBlockBanner: React.FC<{
  checkName: string;
  message: string;
  receiptId?: string;
  standardId?: string;
  onOpenReceipt?: () => void;
  onOpenStandard?: () => void;
}> = ({ checkName, message, receiptId, standardId, onOpenReceipt, onOpenStandard }) => (
  <div className="checkBlockBanner" role="alert">
    <div className="between">
      <div>
        <div className="eyebrow">{checksCopy.blockEyebrow}</div>
        <div className="h-sec" style={{ marginTop: 4 }}>{checkName}</div>
      </div>
      <span className="pill pill--warn">{checksCopy.blockPill}</span>
    </div>
    <p className="lede" style={{ marginTop: 8 }}>{message}</p>
    <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
      {receiptId && onOpenReceipt && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onOpenReceipt}>
          {checksCopy.openReceipt}
        </button>
      )}
      {standardId && onOpenStandard && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onOpenStandard}>
          {checksCopy.openStandard}
        </button>
      )}
    </div>
  </div>
);
