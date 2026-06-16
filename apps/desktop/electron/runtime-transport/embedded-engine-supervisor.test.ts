import { describe, expect, test } from 'bun:test';
import {
  EmbeddedEngineSupervisor,
  embeddedEngineMaxRestarts,
  isEmbeddedEngineRecoverableError,
  resolveSdkSubprocessPid,
} from './embedded-engine-supervisor';

describe('EmbeddedEngineSupervisor', () => {
  test('defaults to three restarts', () => {
    expect(embeddedEngineMaxRestarts()).toBe(3);
  });

  test('respects OTTO_EMBEDDED_MAX_RESTARTS', () => {
    const prev = process.env.OTTO_EMBEDDED_MAX_RESTARTS;
    process.env.OTTO_EMBEDDED_MAX_RESTARTS = '1';
    try {
      expect(embeddedEngineMaxRestarts()).toBe(1);
    } finally {
      if (prev === undefined) delete process.env.OTTO_EMBEDDED_MAX_RESTARTS;
      else process.env.OTTO_EMBEDDED_MAX_RESTARTS = prev;
    }
  });

  test('bounded restart stops at max', () => {
    const supervisor = new EmbeddedEngineSupervisor(2);
    expect(supervisor.canRestart()).toBe(true);
    supervisor.recordRestart('process exited');
    expect(supervisor.canRestart()).toBe(true);
    supervisor.recordRestart('socket hang up');
    expect(supervisor.canRestart()).toBe(false);
    expect(supervisor.exhausted).toBe(true);
  });

  test('reset clears restart budget after successful init', () => {
    const supervisor = new EmbeddedEngineSupervisor(2);
    supervisor.recordRestart('timed out');
    supervisor.setEnginePid(4242);
    supervisor.reset();
    expect(supervisor.canRestart()).toBe(true);
    expect(supervisor.snapshot('/tmp/letta.js')).toMatchObject({
      cliPath: '/tmp/letta.js',
      enginePid: 4242,
      restartCount: 0,
      exhausted: false,
    });
  });

  test('resolveSdkSubprocessPid reads transport.process.pid when present', () => {
    expect(resolveSdkSubprocessPid(null)).toBeNull();
    expect(resolveSdkSubprocessPid({ transport: { process: { pid: 4242 } } })).toBe(4242);
    expect(resolveSdkSubprocessPid({ transport: { process: { pid: 0 } } })).toBeNull();
  });

  test('isEmbeddedEngineRecoverableError classifies engine failures', () => {
    expect(isEmbeddedEngineRecoverableError('ECONNREFUSED 127.0.0.1')).toBe(true);
    expect(isEmbeddedEngineRecoverableError('Letta session.initialize() timed out after 45000ms')).toBe(true);
    expect(isEmbeddedEngineRecoverableError('Embedded Letta engine not found in app bundle.')).toBe(false);
  });
});
