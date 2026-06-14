/**
 * Derive a short, human-friendly label for the file being edited.
 *
 * Returns the basename when the path points at a real `.json` file
 * (`theme.json`, `styles/dark.json`, …). Returns `null` for anything
 * that isn't a file path — notably the synthetic identifiers a host may
 * use for non-file sources (e.g. the WordPress plugin's
 * `wp_global_styles#123` DB layer) — so the caller can omit the label.
 */
export function themeFileLabel(filePath: string): string | null {
  if (!filePath.endsWith(".json")) {
    return null;
  }
  const basename = filePath.replace(/\\/g, "/").split("/").pop() ?? "";
  return basename === "" ? null : basename;
}
