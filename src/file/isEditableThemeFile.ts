/**
 * Predicate for files the editor can open.
 * @module file/isEditableThemeFile
 */
import { minimatch } from "minimatch";

/**
 * Default glob patterns for files the editor can open.
 *
 * Matches the active theme's `theme.json` (anywhere) and any `*.json` style
 * variation located under a `styles/` directory. The `styles/` match is
 * recursive, mirroring core's `WP_Theme_JSON_Resolver::get_style_variations()`,
 * which scans the directory with a `RecursiveDirectoryIterator`.
 *
 * Users can extend the allowlist via the `wpThemeJsonEditor.includePatterns`
 * setting (e.g. to cover partial theme JSON compiled from a `src/` directory).
 */
export const DEFAULT_INCLUDE_PATTERNS: readonly string[] = [
  "**/theme.json",
  "**/styles/**/*.json",
];

/**
 * Whether a file path matches one of the include patterns.
 *
 * Each pattern is a glob matched against the file path. Paths are
 * normalized to forward slashes first, so Windows (`\`) separators match too.
 *
 * @param filePath Absolute or workspace path to test.
 * @param patterns Glob allowlist; defaults to {@link DEFAULT_INCLUDE_PATTERNS}.
 */
export function isEditableThemeFile(
  filePath: string,
  patterns: readonly string[] = DEFAULT_INCLUDE_PATTERNS,
): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return patterns.some((pattern) =>
    minimatch(normalized, pattern, { dot: true }),
  );
}
