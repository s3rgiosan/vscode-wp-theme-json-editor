/**
 * Shared Tailwind class strings used across field components.
 * Centralised here to avoid duplication and ensure visual consistency.
 */

/** Standard text input styling. */
export const INPUT_CLASS =
  "px-2 py-1 text-xs rounded border border-vscode-input-border bg-vscode-input-bg text-vscode-input-fg focus:outline-none focus:border-vscode-focus-border";

/** Standard text input styling with error border. */
export function inputClass(error?: boolean): string {
  return `px-2 py-1 text-xs rounded border bg-vscode-input-bg text-vscode-input-fg focus:outline-none focus:border-vscode-focus-border ${
    error ? "border-vscode-error-fg" : "border-vscode-input-border"
  }`;
}

/** Field label styling (top-level fields). */
export const LABEL_CLASS = "block text-xs font-medium mb-1";

/** Sub-label styling (inside array items, custom variables). */
export const SUB_LABEL_CLASS = "block text-[11px] text-vscode-description-fg mb-0.5";

/** Inline validation error message. */
export const ERROR_CLASS = "text-[10px] text-vscode-error-fg mt-0.5";

/** Color picker swatch input. */
export const COLOR_SWATCH_CLASS =
  "w-8 h-8 rounded border border-vscode-input-border cursor-pointer";

/** Small delete/remove button. */
export const DELETE_BUTTON_CLASS =
  "text-[10px] text-vscode-error-fg hover:opacity-80 px-0.5 shrink-0";

/** CSS variable name preview text. */
export const CSS_VAR_PREVIEW_CLASS =
  "text-[9px] text-vscode-description-fg font-mono mt-1";

/** Accordion header row. */
export const ACCORDION_HEADER_CLASS =
  "flex items-center gap-1 px-2 h-[28px] bg-vscode-sidebar-bg";

/** Primary action button. */
export const PRIMARY_BUTTON_CLASS =
  "px-2 py-0.5 text-[11px] rounded bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover";
