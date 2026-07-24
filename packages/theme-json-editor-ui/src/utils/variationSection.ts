/**
 * Helpers for the "Variation" section — the root-level keys a style
 * variation file declares (`title`, `slug`, `description`, `blockTypes`).
 *
 * A file under a theme's `styles/` directory is a style variation. When it
 * also declares `blockTypes`, WordPress registers it as a block style
 * variation on each listed block instead of a whole-site variation.
 */
import type { SchemaNode } from "../components/fieldRenderer";

/** Sidebar/section key for the synthetic Variation section. */
export const VARIATION_SECTION = "variation";

/**
 * Sidebar/section key for the list of sibling variation files. Distinct from
 * {@link VARIATION_SECTION}, which edits the open file's own metadata.
 */
export const VARIATION_FILES_SECTION = "variations";

/** Root keys shown in the Variation section, in display order. */
export const VARIATION_KEYS = [
  "title",
  "slug",
  "description",
  "blockTypes",
] as const;

/**
 * Whether the Variation section applies to the open document.
 *
 * True when the file lives under a `styles/` directory — matched
 * recursively, mirroring core's `WP_Theme_JSON_Resolver::get_style_variations()`
 * — or when the document already declares one of the variation keys, so a
 * partial kept outside `styles/` (via `includePatterns`) never hides its own
 * metadata.
 *
 * @param filePath  Path of the open file, with either separator style.
 * @param themeJson Parsed document.
 */
export function hasVariationSection(
  filePath: string,
  themeJson: Record<string, unknown>,
): boolean {
  const segments = filePath.replace(/\\/g, "/").split("/");
  // The last segment is the file itself, so only the parents can be `styles`.
  if (segments.slice(0, -1).includes("styles")) {
    return true;
  }
  return VARIATION_KEYS.some((key) => themeJson[key] !== undefined);
}

/**
 * Build a synthetic schema node for the Variation section.
 *
 * The variation keys are siblings of `settings`/`styles` at the schema root,
 * not a nested object, so there is no real node to navigate to. This groups
 * them into one, leaving field paths rooted (`["title"]`, `["blockTypes"]`).
 * Keys the schema does not define are omitted, so older schema versions
 * degrade to whichever keys they do have.
 *
 * @param schema Resolved theme.json schema.
 */
export function buildVariationSchemaNode(schema: SchemaNode): SchemaNode {
  const rootProperties = schema.properties;
  const properties: Record<string, SchemaNode> = {};

  for (const key of VARIATION_KEYS) {
    const node = rootProperties?.[key];
    if (node) {
      properties[key] = node;
    }
  }

  return { type: "object", properties };
}
