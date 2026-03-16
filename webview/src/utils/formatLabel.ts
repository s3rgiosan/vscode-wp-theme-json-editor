/**
 * Label overrides for property keys that don't convert cleanly from camelCase.
 * Acronyms, abbreviations, and domain-specific terms are mapped explicitly.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  // Acronyms
  css: "CSS",
  url: "URL",
  api: "API",
  // Common theme.json property names
  name: "Name",
  title: "Title",
  slug: "Slug",
  area: "Area",
  postTypes: "Post Types",
  color: "Color",
  gradient: "Gradient",
  size: "Size",
  fontFamily: "Font Family",
  fontFace: "Font Face",
  fontWeight: "Font Weight",
  fontStyle: "Font Style",
  fontDisplay: "Font Display",
  fontStretch: "Font Stretch",
  src: "Source",
  unicodeRange: "Unicode Range",
  ascentOverride: "Ascent Override",
  descentOverride: "Descent Override",
  lineGapOverride: "Line Gap Override",
  sizeAdjust: "Size Adjust",
  fontFeatureSettings: "Font Feature Settings",
  fontVariationSettings: "Font Variation Settings",
};

/**
 * Convert a camelCase property key to a human-readable label.
 * Checks explicit overrides first, then falls back to camelCase splitting.
 *
 * @param key - The property key to format (e.g. "fontFamily", "css").
 * @returns A human-readable label (e.g. "Font Family", "CSS").
 */
export function formatLabel(key: string): string {
  const override = LABEL_OVERRIDES[key];
  if (override) {
    return override;
  }
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/**
 * Explicit singular overrides for common theme.json array property labels
 * that don't follow simple pluralisation rules.
 */
export const SINGULAR_OVERRIDES: Record<string, string> = {
  "Font Families": "Font Family",
  "Font Sizes": "Font Size",
  "Spacing Sizes": "Spacing Size",
  "Post Types": "Post Type",
};

/**
 * Naive singularize for common theme.json array property names.
 * Falls back to the original string if no rule matches.
 */
export function singularize(label: string): string {
  const override = SINGULAR_OVERRIDES[label];
  if (override) {
    return override;
  }
  if (label.endsWith("ies")) {
    return label.slice(0, -3) + "y";
  }
  if (label.endsWith("es") && !label.endsWith("ses")) {
    return label.slice(0, -1);
  }
  if (label.endsWith("s") && !label.endsWith("ss")) {
    return label.slice(0, -1);
  }
  return label;
}
