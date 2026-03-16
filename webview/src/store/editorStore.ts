import { create } from "zustand";
import { minifyCss, prettifyCss } from "../utils/css";
import { getNestedValue, setNestedValue } from "../utils/nested";
import { validateThemeJson, type ValidationError } from "../utils/validate";

/**
 * State shape for the theme.json editor.
 */
export interface EditorState {
  /** Current working copy of the theme.json data. */
  themeJson: Record<string, unknown>;
  /** Last-saved copy, used for dirty detection and discard. */
  savedThemeJson: Record<string, unknown>;
  /** Merged schema (official + experimental/undocumented flags). */
  schema: Record<string, unknown>;
  /** Schema version string (e.g. "6.7"). */
  schemaVersion: string;
  /** Whether the working copy differs from the saved copy. */
  isDirty: boolean;
  /** Whether to show experimental/undocumented properties. */
  showExperimental: boolean;
  /** Currently active sidebar section (e.g. "settings.color"). */
  activeSection: string;
  /** Relative file path of the open theme.json. */
  filePath: string;
  /** External file data when a conflict is detected, or null. */
  conflictData: Record<string, unknown> | null;
  /** Validation errors from the last schema validation pass. */
  validationErrors: ValidationError[];
  /** Current global search query (empty string = no search). */
  searchQuery: string;
}

/**
 * Actions available on the editor store.
 */
export interface EditorActions {
  setInitialData: (data: Record<string, unknown>, filePath: string) => void;
  setSchema: (schema: Record<string, unknown>, version: string) => void;
  setField: (path: string[], value: unknown) => void;
  addItem: (path: string[]) => void;
  removeItem: (path: string[], index: number) => void;
  resetToSaved: () => void;
  markSaved: () => void;
  setShowExperimental: (show: boolean) => void;
  setActiveSection: (section: string) => void;
  setExternalData: (data: Record<string, unknown>) => void;
  setConflictData: (data: Record<string, unknown>) => void;
  dismissConflict: () => void;
  setSearchQuery: (query: string) => void;
}

type EditorStore = EditorState & EditorActions;

/**
 * Central Zustand store for all editor state.
 * Components read slices via selectors; mutations go through actions.
 */
export const useEditorStore = create<EditorStore>((set) => ({
  themeJson: {},
  savedThemeJson: {},
  schema: {},
  schemaVersion: "",
  isDirty: false,
  showExperimental: false,
  activeSection: "settings",
  filePath: "",
  conflictData: null,
  validationErrors: [],
  searchQuery: "",

  setInitialData: (data, filePath) => {
    const prettified = prettifyCssFields(data);
    set({
      themeJson: prettified,
      savedThemeJson: structuredClone(prettified),
      isDirty: false,
      filePath,
    });
  },

  setSchema: (schema, version) =>
    set({ schema, schemaVersion: version }),

  setField: (path, value) =>
    set((state) => {
      const themeJson = setNestedValue(state.themeJson, path, value);
      scheduleValidation(themeJson, state.schema);
      return { themeJson, isDirty: true };
    }),

  addItem: (path) =>
    set((state) => {
      const current = getNestedValue(state.themeJson, path);
      const arr = Array.isArray(current) ? [...current, {}] : [{}];
      return {
        themeJson: setNestedValue(state.themeJson, path, arr),
        isDirty: true,
      };
    }),

  removeItem: (path, index) =>
    set((state) => {
      const current = getNestedValue(state.themeJson, path);
      if (!Array.isArray(current)) {
        return state;
      }
      const arr = current.filter((_, i) => i !== index);
      return {
        themeJson: setNestedValue(state.themeJson, path, arr),
        isDirty: true,
      };
    }),

  resetToSaved: () =>
    set((state) => ({
      themeJson: structuredClone(state.savedThemeJson),
      isDirty: false,
    })),

  markSaved: () =>
    set((state) => ({
      savedThemeJson: structuredClone(state.themeJson),
      isDirty: false,
    })),

  setShowExperimental: (show) => set({ showExperimental: show }),

  setActiveSection: (section) => set({ activeSection: section }),

  setExternalData: (data) => {
    const prettified = prettifyCssFields(data);
    set({
      themeJson: prettified,
      savedThemeJson: structuredClone(prettified),
      isDirty: false,
      conflictData: null,
    });
  },

  setConflictData: (data) =>
    set({ conflictData: data }),

  dismissConflict: () =>
    set({ conflictData: null }),

  setSearchQuery: (query) =>
    set({ searchQuery: query }),
}));

/**
 * Returns the current themeJson with all CSS fields minified for saving.
 * Standalone function to avoid circular type references in the store.
 */
export function getDataForSave(): Record<string, unknown> {
  const { themeJson } = useEditorStore.getState();
  return minifyCssFields(themeJson);
}

/**
 * Performs the save action: gathers data and posts SAVE_REQUEST to the host.
 * Shared by SaveBar (button click) and useMessageListener (Cmd+S keybinding).
 * No-ops if there are no unsaved changes.
 */
export function performSave(
  postMessage: (msg: { type: "SAVE_REQUEST"; data: Record<string, unknown> }) => void,
): void {
  const { isDirty } = useEditorStore.getState();
  if (!isDirty) return;
  const data = getDataForSave();
  postMessage({ type: "SAVE_REQUEST", data });
}

/**
 * Walk an object and transform all "css" string properties.
 */
function transformCssFields(
  data: Record<string, unknown>,
  transform: (css: string) => string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "css" && typeof value === "string") {
      result[key] = transform(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = transformCssFields(value as Record<string, unknown>, transform);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null && !Array.isArray(item)
          ? transformCssFields(item as Record<string, unknown>, transform)
          : item,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/** Prettify all CSS string properties in a theme.json object (for editor display). */
function prettifyCssFields(data: Record<string, unknown>): Record<string, unknown> {
  return transformCssFields(data, prettifyCss);
}

/** Minify all CSS string properties in a theme.json object (for file storage). */
function minifyCssFields(data: Record<string, unknown>): Record<string, unknown> {
  return transformCssFields(data, minifyCss);
}

/**
 * Debounced validation to avoid running ajv on every keystroke.
 * Runs 500ms after the last field change.
 */
let validationTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleValidation(
  data: Record<string, unknown>,
  schema: Record<string, unknown>,
): void {
  if (validationTimer) {
    clearTimeout(validationTimer);
  }
  validationTimer = setTimeout(() => {
    const errors = validateThemeJson(data, schema);
    useEditorStore.setState({ validationErrors: errors });
  }, 500);
}
