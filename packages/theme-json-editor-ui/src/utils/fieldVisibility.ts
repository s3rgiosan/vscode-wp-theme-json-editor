/**
 * Decides whether a schema property is shown in the editor's navigation and
 * forms, from the flags the schema merger sets on the node.
 */

/**
 * Flag on a root `styles` property that WordPress keeps only in a block style
 * variation partial (a file with a non-empty `blockTypes`). A regular
 * theme.json drops the property at the root.
 */
export const BLOCK_STYLE_VARIATION_ONLY_FLAG =
  "x-wpthemejsoneditor-block-style-variation-only";

export interface FieldVisibilityContext {
  /** Whether experimental and undocumented properties are shown. */
  readonly showExperimental: boolean;
  /** Whether the open document is a block style variation partial. */
  readonly isBlockStyleVariation: boolean;
}

/**
 * Whether a schema property is shown for the open document.
 *
 * @param node    Schema node of the property.
 * @param context Editor state that affects visibility.
 */
export function isFieldVisible(
  node: Record<string, unknown>,
  { showExperimental, isBlockStyleVariation }: FieldVisibilityContext,
): boolean {
  const isFlagged =
    node["x-wpthemejsoneditor-experimental"] === true ||
    node["x-wpthemejsoneditor-undocumented"] === true;
  if (isFlagged && !showExperimental) {
    return false;
  }

  if (node[BLOCK_STYLE_VARIATION_ONLY_FLAG] === true && !isBlockStyleVariation) {
    return false;
  }

  return true;
}
