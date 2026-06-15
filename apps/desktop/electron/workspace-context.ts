import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { defaultOttoDir } from './config-store';
import type { ConfigStore } from './config-store';
import type { ThreadStore } from './thread-store';
import type { RuntimeStatus, WorkspaceContext } from './shared/types';
import { readAppBuildInfo } from './build-info';

export function readWorkspaceContext(
  config: ConfigStore,
  threads: ThreadStore,
  status: RuntimeStatus | null,
): WorkspaceContext {
  const ottoHome = defaultOttoDir();
  const projectRoot = process.env.OTTO_ROOT?.trim()
    ? resolve(process.env.OTTO_ROOT.trim())
    : resolve(process.cwd());
  const build = readAppBuildInfo();
  const threadList = threads.list();
  const active = threadList.threads.find((t) => t.id === threadList.activeThreadId) ?? null;

  return {
    projectRoot,
    ottoHome,
    profileHome: build.profilePath ?? build.homePath ?? homedir(),
    lettaStateDir: config.lettaStateDir(),
    activeThread: active
      ? {
          id: active.id,
          title: active.title,
          conversationId: active.lettaConversationId ?? null,
          agentId: active.agentId ?? null,
        }
      : null,
    runtime: status
      ? {
          ready: status.ready,
          agentId: status.agentId ?? null,
          conversationId: status.conversationId ?? null,
          transportMode: status.transportMode ?? null,
          effectiveTransport: status.effectiveTransport ?? null,
          model: status.model ?? status.modelHandle ?? null,
        }
      : null,
    projectSwitch: {
      allowed: false,
      reason:
        'v1 binds one repo folder per otto home. To work in another project, set OTTO_ROOT before launch or use a separate OTTO_HOME profile.',
    },
  };
}
