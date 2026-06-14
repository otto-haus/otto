import React from 'react';
import { statusPill } from './StatusPill';

export type ReceiptCardSummary = {
  id: string;
  action: string;
  status: string;
  summary: string;
  metaLine: string;
  blockerCode?: string | null;
};

export const ReceiptCard: React.FC<{
  receipt: ReceiptCardSummary;
  selected?: boolean;
  onSelect: () => void;
}> = ({ receipt, selected, onSelect }) => (
  <button
    type="button"
    className={`card receiptCard${selected ? ' is-selected' : ''}`}
    aria-current={selected ? 'true' : undefined}
    onClick={onSelect}
  >
    <div className="between">
      <span className="card__title">{receipt.action}</span>
      {statusPill(receipt.status)}
    </div>
    <span className="card__sub">{receipt.summary}</span>
    <span className="receiptCard__meta mono">{receipt.metaLine}</span>
    {receipt.blockerCode && <span className="filechip">{receipt.blockerCode}</span>}
  </button>
);
