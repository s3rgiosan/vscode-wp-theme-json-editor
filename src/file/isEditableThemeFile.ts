/**
 * Predicate for files the editor can open.
 * @module file/isEditableThemeFile
 */

/**
 * Whether a file path is an editable WordPress theme JSON file.
 *
 * Matches the active theme's `theme.json` (anywhere) and any `*.json` style
 * variation located under a `styles/` directory. The `styles/` match is
 * recursive, mirroring core's `WP_Theme_JSON_Resolver::get_style_variations()`,
 * which scans the directory with a `RecursiveDirectoryIterator`.
 *
 * Accepts both POSIX (`/`) and Windows (`\`) separators.
 */
export function isEditableThemeFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  const basename = normalized.split("/").pop() ?? "";

  if (basename === "theme.json") {
    return true;
  }

  if (!basename.endsWith(".json")) {
    return false;
  }

  return /\/styles\//.test(normalized);
}
