/**
 * Parsing helpers for the style variations that live in a theme's `styles/`
 * directory. Pure functions — the file system access lives in
 * {@link module:file/VariationScanner}.
 *
 * @module file/variationSummary
 */

/** What the editor shows about one `styles/*.json` file. */
export interface VariationSummary {
  /** Path of the file, relative to the workspace. */
  readonly path: string;
  /** Declared title, or the file name when absent. */
  readonly title: string;
  /** Declared slug, or the kebab-cased title when absent. */
  readonly slug: string;
  /** Blocks the variation registers on; empty for a global variation. */
  readonly blockTypes: string[];
}

/** A file to summarize: its workspace-relative path and raw contents. */
export interface VariationFile {
  readonly path: string;
  readonly content: string;
}

/**
 * The theme directory a file belongs to — the parent of `styles/` for a
 * variation, or the file's own directory otherwise.
 *
 * @param filePath Path with either separator style.
 */
export function getThemeRootPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  const stylesIndex = segments.slice(0, -1).lastIndexOf("styles");
  const rootSegments =
    stylesIndex === -1 ? segments.slice(0, -1) : segments.slice(0, stylesIndex);
  return rootSegments.join("/");
}

/**
 * Summarize one variation file. Returns undefined when the contents are not a
 * JSON object, so an unparsable file is skipped rather than breaking the list.
 *
 * Title and slug follow core's fallbacks: an absent title becomes the file
 * name, and an absent slug the kebab-cased title.
 *
 * @param path    Workspace-relative path of the file.
 * @param content Raw file contents.
 */
export function summarizeVariation(
  path: string,
  content: string,
): VariationSummary | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return undefined;
  }

  const data = parsed as Record<string, unknown>;
  const fileName = path.replace(/\\/g, "/").split("/").pop() ?? "";
  const declaredTitle = typeof data["title"] === "string" ? data["title"].trim() : "";
  const title = declaredTitle !== "" ? declaredTitle : fileName.replace(/\.json$/i, "");
  const declaredSlug = typeof data["slug"] === "string" ? data["slug"].trim() : "";
  const blockTypes = Array.isArray(data["blockTypes"])
    ? data["blockTypes"].filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];

  return {
    path,
    title,
    slug: declaredSlug !== "" ? declaredSlug : toKebabCase(title),
    blockTypes,
  };
}

/**
 * Summarize every file that parses, sorted by title.
 *
 * @param files Files found under the theme's `styles/` directory.
 */
export function summarizeVariations(
  files: readonly VariationFile[],
): VariationSummary[] {
  return files
    .map(({ path, content }) => summarizeVariation(path, content))
    .filter((summary): summary is VariationSummary => summary !== undefined)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Lower-case, hyphen-separated form of a title. */
function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}
