/**
 * Typed message protocol between the extension host and the Webview.
 * Uses a discriminated union on the `type` field.
 *
 * This file is shared between the extension host and the webview.
 * Import from here to ensure compile-time type safety on both sides.
 */

// --- Host → Webview messages ---

export interface InitDataMessage {
  readonly type: "INIT_DATA";
  readonly data: Record<string, unknown>;
  readonly filePath: string;
}

export interface FileChangedMessage {
  readonly type: "FILE_CHANGED";
  readonly data: Record<string, unknown>;
}

export interface FileChangedConflictMessage {
  readonly type: "FILE_CHANGED_CONFLICT";
  readonly data: Record<string, unknown>;
}

export interface FileSavedMessage {
  readonly type: "FILE_SAVED";
}

export interface SchemaReadyMessage {
  readonly type: "SCHEMA_READY";
  readonly schema: Record<string, unknown>;
  readonly schemaVersion: string;
}

export interface SettingsMessage {
  readonly type: "SETTINGS";
  readonly showExperimentalByDefault: boolean;
}

/** Sent by the host when the user triggers save via keybinding (e.g. Cmd+S). */
export interface TriggerSaveMessage {
  readonly type: "TRIGGER_SAVE";
}

export type HostToWebviewMessage =
  | InitDataMessage
  | FileChangedMessage
  | FileChangedConflictMessage
  | FileSavedMessage
  | SchemaReadyMessage
  | SettingsMessage
  | TriggerSaveMessage;

// --- Webview → Host messages ---

export interface SaveRequestMessage {
  readonly type: "SAVE_REQUEST";
  readonly data: Record<string, unknown>;
}

/**
 * Sent by the webview when it has mounted and is ready to receive data.
 * The host responds with INIT_DATA, SETTINGS, and SCHEMA_READY.
 */
export interface WebviewReadyMessage {
  readonly type: "WEBVIEW_READY";
}

export interface DirtyStateMessage {
  readonly type: "DIRTY_STATE";
  readonly isDirty: boolean;
}

export type WebviewToHostMessage =
  | SaveRequestMessage
  | WebviewReadyMessage
  | DirtyStateMessage;
