/**
 * Public library entry for `@s3rgiosan/theme-json-editor-ui`.
 *
 * Hosts (VS Code extension, WP admin plugin, …) consume the editor in
 * one of two ways:
 *
 *   1. `mountEditor(rootEl, host)` — drops the full editor into an
 *      element. Use when the host wants the whole shell (Toolbar +
 *      Sidebar + section panel + SaveBar).
 *
 *   2. Compose individual exports (`SectionPanel`, `Sidebar`,
 *      `Toolbar`, `SaveBar`, store, `useHost`, …) inside a custom
 *      layout. Use when the host wraps its own chrome around the
 *      schema-driven body (e.g. WP plugin using `wp-interface`).
 */

// Mount + whole-app
export { App } from "./App";
export { mountEditor } from "./mount";

// Layout pieces (composable)
export { Toolbar } from "./components/Toolbar";
export { Sidebar } from "./components/Sidebar";
export { SectionPanel } from "./components/SectionPanel";
export { SaveBar } from "./components/SaveBar";
export { ConflictBanner } from "./components/ConflictBanner";
export { Breadcrumbs } from "./components/Breadcrumbs";

// Host abstraction
export type {
  HostAdapter,
  HostEvents,
  HostMode,
  CoreScanSnapshot,
} from "./host/HostAdapter";
export { HostProvider } from "./host/HostContext";
export { useHost } from "./host/useHost";
export { vscodeHost } from "./host/vscodeHost";

// Store + hooks
export {
  useEditorStore,
  performSave,
  getDataForSave,
} from "./store/editorStore";
export type { EditorState, EditorActions } from "./store/editorStore";
export { useHostBootstrap } from "./hooks/useHostBootstrap";

// Schema utilities
export { SchemaResolver } from "./schema/SchemaResolver";
export { SchemaMerger } from "./schema/SchemaMerger";
