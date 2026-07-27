/**
 * Building blocks for the "New Block Style Variation" command. Pure
 * functions — the prompts and file writing live in the command itself.
 *
 * @module file/variationScaffold
 */

/** Inputs for a scaffolded variation file. */
export interface VariationDocumentInput {
  readonly title: string;
  readonly slug: string;
  /** Blocks to register on; empty writes a global style variation. */
  readonly blockTypes: readonly string[];
  /** `$schema` URI, taken from the theme's own theme.json when available. */
  readonly schemaUri: string;
  readonly version: number;
}

/**
 * Slug for a variation title, following core's kebab-case convention.
 * Also used as the file name.
 *
 * @param title Human-readable variation title.
 */
export function toVariationSlug(title: string): string {
  return title
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parse the comma-separated block list the command prompts for. Blank input
 * is valid and means a global style variation.
 *
 * @param input Raw text entered by the user.
 */
export function parseBlockTypesInput(input: string): string[] {
  const names = input
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");
  return [...new Set(names)];
}

/**
 * Build the document written to `styles/<slug>.json`. Keys are ordered the
 * way WordPress documents them, and `blockTypes` is omitted entirely for a
 * global variation rather than written as an empty array.
 */
export function buildVariationDocument({
  title,
  slug,
  blockTypes,
  schemaUri,
  version,
}: VariationDocumentInput): Record<string, unknown> {
  const document: Record<string, unknown> = {
    $schema: schemaUri,
    version,
    title,
    slug,
  };

  if (blockTypes.length > 0) {
    document["blockTypes"] = [...blockTypes];
  }

  document["styles"] = {};

  return document;
}
