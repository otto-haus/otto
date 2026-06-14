/** In-memory tool allowlist for Chat "Allow for session" (045). Cleared on new chat / app restart. */
export class PermissionSessionStore {
  private allowed = new Set<string>();

  allow(toolName: string): void {
    const name = toolName.trim();
    if (name) this.allowed.add(name);
  }

  isAllowed(toolName: string): boolean {
    return this.allowed.has(toolName.trim());
  }

  clear(): void {
    this.allowed.clear();
  }

  list(): string[] {
    return [...this.allowed];
  }
}

export const permissionSessionStore = new PermissionSessionStore();
