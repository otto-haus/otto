import type { PermissionRequestView } from '../components/ui';

/** Append a permission request unless that requestId is already queued. */
export function enqueuePermissionRequest(
  queue: PermissionRequestView[],
  req: PermissionRequestView,
): PermissionRequestView[] {
  if (queue.some((item) => item.requestId === req.requestId)) return queue;
  return [...queue, req];
}

/** Drop the oldest unresolved permission request (FIFO). */
export function dequeuePermissionRequest(queue: PermissionRequestView[]): PermissionRequestView[] {
  return queue.slice(1);
}

export function headPermissionRequest(queue: PermissionRequestView[]): PermissionRequestView | null {
  return queue[0] ?? null;
}
