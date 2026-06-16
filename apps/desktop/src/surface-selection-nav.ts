export const RECEIPTS_SELECTED_KEY = 'otto.receipts.selectedId';
export const STANDARDS_SELECTED_KEY = 'otto.standards.selectedSlug';

export function stageReceiptSelection(receiptId: string): void {
  try {
    sessionStorage.setItem(RECEIPTS_SELECTED_KEY, receiptId);
  } catch { /* best effort */ }
}

export function readStoredReceiptSelection(): string | null {
  try {
    const value = sessionStorage.getItem(RECEIPTS_SELECTED_KEY);
    if (value) sessionStorage.removeItem(RECEIPTS_SELECTED_KEY);
    return value || null;
  } catch {
    return null;
  }
}

export function stageStandardSelection(slug: string): void {
  try {
    sessionStorage.setItem(STANDARDS_SELECTED_KEY, slug);
  } catch { /* best effort */ }
}

export function readStoredStandardSelection(): string | null {
  try {
    const value = sessionStorage.getItem(STANDARDS_SELECTED_KEY);
    if (value) sessionStorage.removeItem(STANDARDS_SELECTED_KEY);
    return value || null;
  } catch {
    return null;
  }
}

export function openReceipt(
  receiptId: string,
  onNavigate?: (surface: 'receipts') => void,
): void {
  stageReceiptSelection(receiptId);
  if (onNavigate) {
    onNavigate('receipts');
  } else if (typeof location !== 'undefined') {
    location.hash = 'receipts';
  }
}

export function openStandard(
  standardSlug: string,
  onNavigate?: (surface: 'standards') => void,
): void {
  stageStandardSelection(standardSlug);
  if (onNavigate) {
    onNavigate('standards');
  } else if (typeof location !== 'undefined') {
    location.hash = 'standards';
  }
}
