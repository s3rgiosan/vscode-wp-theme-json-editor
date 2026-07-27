/**
 * Advisory hints for the Variation section.
 *
 * These describe how WordPress will read the open file — whether it registers
 * as a block style variation or applies site-wide — and flag declarations that
 * are valid JSON but will not do what the author probably intends.
 */

export type VariationHintSeverity = "info" | "warning";

export interface VariationHint {
  /** Stable identifier, also used as the React key. */
  readonly id: string;
  readonly severity: VariationHintSeverity;
  readonly message: string;
}

/**
 * Build the hint list for the open document.
 *
 * @param filePath  Path of the open file, with either separator style.
 * @param themeJson Parsed document.
 */
export function getVariationHints(
  filePath: string,
  themeJson: Record<string, unknown>,
): VariationHint[] {
  const hints: VariationHint[] = [];
  const blockTypes = themeJson["blockTypes"];
  const blockCount = Array.isArray(blockTypes) ? blockTypes.length : 0;

  hints.push({
    id: "mode",
    severity: "info",
    message:
      blockCount > 0
        ? `Block style variation — registers as a block style on ${blockCount} ${
            blockCount === 1 ? "block" : "blocks"
          }, applied per block via its style.`
        : "Global style variation — applies to the whole site when selected.",
  });

  const fileName = getFileName(filePath);
  const slug = typeof themeJson["slug"] === "string" ? themeJson["slug"].trim() : "";
  const fileSlug = fileName.replace(/\.json$/i, "");
  if (slug !== "" && fileName !== "" && slug.toLowerCase() !== fileSlug.toLowerCase()) {
    hints.push({
      id: "slug",
      severity: "warning",
      message: `Slug "${slug}" does not match the file name "${fileName}". WordPress uses the slug, so the two drifting apart makes the variation harder to find.`,
    });
  }

  if (blockCount > 0 && isEmptyStyles(themeJson["styles"])) {
    hints.push({
      id: "styles",
      severity: "warning",
      message:
        "No styles are defined, so this variation registers on those blocks but changes nothing.",
    });
  }

  return hints;
}

/** Last path segment, with either separator style. */
function getFileName(filePath: string): string {
  const segments = filePath.replace(/\\/g, "/").split("/");
  return segments[segments.length - 1] ?? "";
}

/** Whether `styles` is missing or carries no declarations. */
function isEmptyStyles(styles: unknown): boolean {
  if (typeof styles !== "object" || styles === null) {
    return true;
  }
  return Object.keys(styles as Record<string, unknown>).length === 0;
}
