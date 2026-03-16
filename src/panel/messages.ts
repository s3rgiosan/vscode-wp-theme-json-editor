/**
 * Re-exports the shared message protocol types.
 * The canonical definitions live in src/shared/messages.ts.
 */
export type {
  HostToWebviewMessage,
  WebviewToHostMessage,
  InitDataMessage,
  FileChangedMessage,
  FileChangedConflictMessage,
  FileSavedMessage,
  SchemaReadyMessage,
  SettingsMessage,
  TriggerSaveMessage,
  SaveRequestMessage,
  WebviewReadyMessage,
  DirtyStateMessage,
} from "../shared/messages.js";
