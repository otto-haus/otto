import type { WrittenReceipt } from './receipt-writer';

export type BlockedReceiptListener = (receipt: WrittenReceipt) => void;

const blockedListeners = new Set<BlockedReceiptListener>();

export function onBlockedReceipt(listener: BlockedReceiptListener): () => void {
  blockedListeners.add(listener);
  return () => blockedListeners.delete(listener);
}

export function emitBlockedReceipt(receipt: WrittenReceipt): void {
  if (receipt.status !== 'blocked') return;
  blockedListeners.forEach((listener) => listener(receipt));
}

export function shouldEmitBlockedReceipt(receipt: WrittenReceipt): boolean {
  if (receipt.status !== 'blocked') return false;
  if (receipt.subject.type === 'proposal') return false;
  if (receipt.action.startsWith('curation.')) return false;
  return true;
}
