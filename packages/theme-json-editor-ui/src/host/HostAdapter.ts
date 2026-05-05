/**
 * Host-agnostic interface between the editor UI and whatever runtime
 * embeds it (VS Code webview, WordPress admin page, browser tests, …).
 *
 * The UI never talks to the host directly — it goes through this
 * adapter. Each host implements `start`, `save`, and `reportDirty`
 * however its environment requires (postMessage, fetch, mock, …).
 */

export interface CoreScanSnapshot {
  readonly generatedAt: string;
  readonly wpVersion: string;
  readonly experimental: readonly string[];
  readonly undocumented: readonly string[];
}

export interface HostEvents {
  onInit?: (data: Record<string, unknown>, filePath: string) => void;
  onExternalChange?: (data: Record<string, unknown>) => void;
  onConflict?: (data: Record<string, unknown>) => void;
  onSaved?: () => void;
  onSchemaReady?: (
    schema: Record<string, unknown>,
    snapshot: CoreScanSnapshot,
    schemaVersion: string,
  ) => void;
  onSettings?: (settings: { showExperimental: boolean }) => void;
  onTriggerSave?: () => void;
}

export interface HostAdapter {
  /**
   * Begin emitting events to the listener. Hosts should send the
   * initial INIT_DATA / SETTINGS / SCHEMA_READY sequence here.
   * Returns a disposer that removes the event subscription.
   */
  start(events: HostEvents): () => void;

  /** Persist the given theme.json document. */
  save(data: Record<string, unknown>): void;

  /** Report dirty-state changes so the host can detect external conflicts. */
  reportDirty(isDirty: boolean): void;
}
