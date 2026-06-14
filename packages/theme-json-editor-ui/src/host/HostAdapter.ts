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

/**
 * Optional mode definition supplied by hosts that expose more than
 * one editing target. The Toolbar renders a switcher when at least
 * two modes are available.
 */
export interface HostMode {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  /**
   * Render this mode indented beneath the preceding top-level mode.
   * Used to express the `theme.json` → `styles/*.json` hierarchy in the
   * picker without the UI hardcoding any file semantics.
   */
  readonly indent?: boolean;
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

  /**
   * Optional: declare the editing modes this host exposes. Returning
   * fewer than two modes (or omitting the method entirely) hides the
   * Toolbar mode switcher.
   */
  modes?(): readonly HostMode[];

  /** Optional: id of the currently active mode. */
  getMode?(): string;

  /**
   * Optional: switch the active mode. Hosts should re-emit `onInit`
   * (and `onSaved`) so the editor reloads the new document.
   */
  setMode?(modeId: string): void | Promise<void>;
}
