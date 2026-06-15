import { describe, expect, it } from 'bun:test';
import {
  dequeuePermissionRequest,
  enqueuePermissionRequest,
  headPermissionRequest,
} from './chat-permission-queue';
import type { PermissionRequestView } from '../components/ui';

const req = (id: string, toolName = 'run_shell'): PermissionRequestView => ({
  requestId: id,
  toolName,
  toolInput: { cmd: id },
  interactive: false,
});

describe('chat permission queue (#709)', () => {
  it('enqueues requests in arrival order without duplicate requestIds', () => {
    let queue: PermissionRequestView[] = [];
    queue = enqueuePermissionRequest(queue, req('a'));
    queue = enqueuePermissionRequest(queue, req('b'));
    queue = enqueuePermissionRequest(queue, req('a'));
    expect(queue.map((item) => item.requestId)).toEqual(['a', 'b']);
    expect(headPermissionRequest(queue)?.requestId).toBe('a');
  });

  it('dequeues FIFO so resolving the head exposes the next gate', () => {
    let queue = [req('first'), req('second')];
    queue = dequeuePermissionRequest(queue);
    expect(headPermissionRequest(queue)?.requestId).toBe('second');
    queue = dequeuePermissionRequest(queue);
    expect(headPermissionRequest(queue)).toBeNull();
  });
});
