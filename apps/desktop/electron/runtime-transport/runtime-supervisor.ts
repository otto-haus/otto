import type { BrowserWindow } from 'electron';
import type { PermissionResponse, RuntimePreferences, RuntimeStatus } from '../shared/types';
import type { ConfigStore } from '../config-store';
import { SdkSubprocessTransport } from './sdk-subprocess-transport';
import { WsRuntimeTransport } from './ws-runtime-transport';
import { resolveTransportMode } from './transport-mode';
import { WS_PROMOTION_GATE_REASON, wsPromotionApproved } from './ws-promotion-gate';
import type { OttoRuntimeTransport, RuntimeTransportMode } from './types';

/** Owns transport selection, fallback, and delegation to the active implementation. */
export class RuntimeSupervisor implements OttoRuntimeTransport {
  private readonly sdk: SdkSubprocessTransport;
  private readonly ws: WsRuntimeTransport;
  private readonly mode: RuntimeTransportMode;
  private active: OttoRuntimeTransport;

  constructor(win: BrowserWindow, config: ConfigStore) {
    this.sdk = new SdkSubprocessTransport(win, config);
    this.ws = new WsRuntimeTransport(win, config);
    this.mode = resolveTransportMode();
    this.active = this.sdk;
  }

  getStatus(): RuntimeStatus {
    return this.withModeMeta(this.active.getStatus());
  }

  resolvePermission(requestId: string, response: PermissionResponse) {
    this.sdk.resolvePermission(requestId, response);
    this.ws.resolvePermission(requestId, response);
  }

  async init(opts?: { freshConversation?: boolean }): Promise<RuntimeStatus> {
    if (this.mode === 'sdk') {
      this.active = this.sdk;
      await this.ws.close().catch(() => {});
      return this.withModeMeta(await this.sdk.init(opts), 'sdk', 'sdk subprocess', null);
    }
    if (this.mode === 'ws') {
      this.active = this.ws;
      await this.sdk.close().catch(() => {});
      return this.withModeMeta(await this.ws.init(opts), 'ws', 'websocket local', null);
    }
    if (!wsPromotionApproved()) {
      this.active = this.sdk;
      await this.ws.close().catch(() => {});
      return this.withModeMeta(
        await this.sdk.init(opts),
        'auto',
        'sdk subprocess',
        WS_PROMOTION_GATE_REASON,
      );
    }
    await this.sdk.close().catch(() => {});
    const wsStatus = await this.ws.init(opts);
    if (wsStatus.ready) {
      this.active = this.ws;
      return this.withModeMeta(wsStatus, 'auto', 'websocket local', null);
    }
    const fallbackReason = wsStatus.reason ?? 'WebSocket transport unavailable';
    await this.ws.close().catch(() => {});
    this.active = this.sdk;
    const sdkStatus = await this.sdk.init(opts);
    return this.withModeMeta(sdkStatus, 'auto', 'sdk subprocess', fallbackReason);
  }

  async newChat(): Promise<RuntimeStatus> {
    return this.withModeMeta(await this.active.newChat());
  }

  async configure(input: RuntimePreferences): Promise<RuntimeStatus> {
    return this.withModeMeta(await this.active.configure(input));
  }

  async send(text: string): Promise<void> {
    return this.active.send(text);
  }

  async steer(text: string): Promise<void> {
    return this.active.steer(text);
  }

  async abort(): Promise<void> {
    return this.active.abort();
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.sdk.close(), this.ws.close()]);
  }

  private withModeMeta(
    status: RuntimeStatus,
    mode: RuntimeTransportMode = this.mode,
    effective?: RuntimeStatus['effectiveTransport'],
    fallbackReason?: string | null,
  ): RuntimeStatus {
    return {
      ...status,
      transportMode: mode,
      effectiveTransport: effective ?? status.effectiveTransport ?? (this.active === this.ws ? 'websocket local' : 'sdk subprocess'),
      transportFallbackReason: fallbackReason !== undefined ? fallbackReason : status.transportFallbackReason ?? null,
    };
  }
}
