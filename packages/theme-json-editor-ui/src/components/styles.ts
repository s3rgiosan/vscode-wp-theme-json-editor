/**
 * Shared Tailwind class strings used across field components.
 * Centralised here to avoid duplication and ensure visual consistency.
 */

/** Standard text input styling. */
export const INPUT_CLASS =
  "px-2 py-1 rounded border border-tje-input-border bg-tje-input-bg text-tje-input-fg focus:outline-none focus:border-tje-focus-border";

/** Standard text input styling with error border. */
export function inputClass(error?: boolean): string {
  return `px-2 py-1 rounded border bg-tje-input-bg text-tje-input-fg focus:outline-none focus:border-tje-focus-border ${
    error ? "border-tje-error-fg" : "border-tje-input-border"
  }`;
}

/** Field label styling (top-level fields). */
export const LABEL_CLASS = "block font-medium mb-1";

/** Sub-label styling (inside array items, custom variables). */
export const SUB_LABEL_CLASS = "block text-secondary text-tje-description-fg mb-0.5";

/** Inline validation error message. */
export const ERROR_CLASS = "text-tertiary text-tje-error-fg mt-0.5";

/** Color picker swatch input. */
export const COLOR_SWATCH_CLASS =
  "w-8 h-8 rounded border border-tje-input-border cursor-pointer";

/** Small delete/remove button. */
export const DELETE_BUTTON_CLASS =
  "text-tertiary text-tje-error-fg hover:opacity-80 px-0.5 shrink-0";

/** CSS variable name preview text. */
export const CSS_VAR_PREVIEW_CLASS =
  "text-quaternary text-tje-description-fg font-mono mt-1";

/** Accordion header row. */
export const ACCORDION_HEADER_CLASS =
  "flex items-center gap-1 px-2 h-[30px] bg-tje-sidebar-bg";

/** Primary action button. */
export const PRIMARY_BUTTON_CLASS =
  "px-2 py-0.5 text-secondary rounded bg-tje-button-bg text-tje-button-fg hover:bg-tje-button-hover";
