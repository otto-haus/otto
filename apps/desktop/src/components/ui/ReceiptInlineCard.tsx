import React from 'react';
import { receiptsCopy } from '../../copy/surfaces';

export type ReceiptInlineCardProps = {
  id: string;
  status: 'success' | 'blocked' | 'failed';
  action: string;
  summary: string;
  authority?: string;
  onOpenReceipts?: () => void;
};

export const ReceiptInlineCard: React.FC<ReceiptInlineCardProps> = ({
  id,
  status,
  action,
  summary,
  authority,
  onOpenReceipts,
}) => (
  <div className={`receiptInline panel receiptInline--${status}`}>
    <div className="between">
      <div className="eyebrow">{receiptsCopy.inlineLabel}</div>
      <span className={`pill${status === 'success' ? ' pill--ok' : status === 'blocked' ? ' pill--warn' : ' pill--stop'}`}>
        {status}
      </span>
    </div>
    <div className="card__title" style={{ marginTop: 8 }}>{summary}</div>
    <dl className="kv receiptKv" style={{ marginTop: 10 }}>
      <div><dt>action</dt><dd>{action}</dd></div>
      <div><dt>id</dt><dd className="mono">{id}</dd></div>
      {authority ? <div><dt>authority</dt><dd>{authority}</dd></div> : null}
    </dl>
    {onOpenReceipts ? (
      <button type="button" className="btn btn--ghost-d" style={{ marginTop: 10 }} onClick={onOpenReceipts}>
        {receiptsCopy.openInReceipts}
      </button>
    ) : null}
  </div>
);
