/**
 * Extracts all available CSS custom property names from a theme.json object.
 *
 * WordPress generates CSS variables from:
 * - Preset arrays (palette, gradients, fontFamilies, fontSizes, spacingSizes)
 * - Custom settings object (recursive key→kebab conversion)
 */

export interface CssVariable {
  /** Full CSS variable name, e.g. `--wp--preset--color--primary`. */
  readonly name: string;
  /** Resolved value if available (hex color, size string, etc.). */
  readonly value?: string;
  /** Human-readable category for grouping in autocomplete. */
  readonly category: string;
}

interface SlugEntry {
  slug?: unknown;
  color?: unknown;
  gradient?: unknown;
  fontFamily?: unknown;
  size?: unknown;
  [key: string]: unknown;
}

/**
 * Extract all CSS variables derivable from a theme.json data object.
 */
import { getNestedValue } from "./nested";

export function extractCssVariables(themeJson: Record<string, unknown>): CssVariable[] {
  const vars: CssVariable[] = [];
  const settings = themeJson["settings"];
  if (typeof settings !== "object" || settings === null) {
    return vars;
  }
  const s = settings as Record<string, unknown>;

  // Preset: colors
  extractPresetArray(
    s,
    ["color", "palette"],
    "color",
    "Color",
    (entry) => (typeof entry.color === "string" ? entry.color : undefined),
    vars,
  );

  // Preset: gradients
  extractPresetArray(
    s,
    ["color", "gradients"],
    "gradient",
    "Gradient",
    (entry) => (typeof entry.gradient === "string" ? entry.gradient : undefined),
    vars,
  );

  // Preset: font families
  extractPresetArray(
    s,
    ["typography", "fontFamilies"],
    "font-family",
    "Font Family",
    (entry) => (typeof entry.fontFamily === "string" ? entry.fontFamily : undefined),
    vars,
  );

  // Preset: font sizes
  extractPresetArray(
    s,
    ["typography", "fontSizes"],
    "font-size",
    "Font Size",
    (entry) => {
      if (typeof entry.size === "string") return entry.size;
      if (typeof entry.size === "number") return String(entry.size);
      return undefined;
    },
    vars,
  );

  // Preset: spacing sizes
  extractPresetArray(
    s,
    ["spacing", "spacingSizes"],
    "spacing",
    "Spacing",
    (entry) => {
      if (typeof entry.size === "string") return entry.size;
      if (typeof entry.size === "number") return String(entry.size);
      return undefined;
    },
    vars,
  );

  // Preset: shadow
  extractPresetArray(
    s,
    ["shadow", "presets"],
    "shadow",
    "Shadow",
    (entry) => (typeof entry.shadow === "string" ? entry.shadow : undefined),
    vars,
  );

  // Preset: aspect ratios
  extractPresetArray(
    s,
    ["dimensions", "aspectRatios"],
    "aspect-ratio",
    "Aspect Ratio",
    (entry) => (typeof entry.ratio === "string" ? entry.ratio : undefined),
    vars,
  );

  // Custom variables (recursive)
  const custom = getNestedValue(s, ["custom"]);
  if (typeof custom === "object" && custom !== null && !Array.isArray(custom)) {
    walkCustom(custom as Record<string, unknown>, [], vars);
  }

  // Block-level presets (settings.blocks.{blockName}.color.palette, etc.)
  const blocks = getNestedValue(s, ["blocks"]);
  if (typeof blocks === "object" && blocks !== null && !Array.isArray(blocks)) {
    const seen = new Set(vars.map((v) => v.name));
    for (const blockSettings of Object.values(blocks as Record<string, unknown>)) {
      if (typeof blockSettings !== "object" || blockSettings === null) continue;
      const bs = blockSettings as Record<string, unknown>;
      extractBlockPresets(bs, seen, vars);
    }
  }

  return vars;
}

/** Extract presets from a single block's settings, skipping already-seen variable names. */
function extractBlockPresets(
  bs: Record<string, unknown>,
  seen: Set<string>,
  out: CssVariable[],
): void {
  const presetConfigs: Array<{
    path: string[];
    presetType: string;
    category: string;
    getValue: (entry: SlugEntry) => string | undefined;
  }> = [
    { path: ["color", "palette"], presetType: "color", category: "Color", getValue: (e) => typeof e.color === "string" ? e.color : undefined },
    { path: ["color", "gradients"], presetType: "gradient", category: "Gradient", getValue: (e) => typeof e.gradient === "string" ? e.gradient : undefined },
    { path: ["color", "duotone"], presetType: "duotone", category: "Duotone", getValue: () => undefined },
    { path: ["typography", "fontFamilies"], presetType: "font-family", category: "Font Family", getValue: (e) => typeof e.fontFamily === "string" ? e.fontFamily : undefined },
    { path: ["typography", "fontSizes"], presetType: "font-size", category: "Font Size", getValue: (e) => typeof e.size === "string" ? e.size : typeof e.size === "number" ? String(e.size) : undefined },
    { path: ["spacing", "spacingSizes"], presetType: "spacing", category: "Spacing", getValue: (e) => typeof e.size === "string" ? e.size : typeof e.size === "number" ? String(e.size) : undefined },
  ];

  for (const config of presetConfigs) {
    const arr = getNestedValue(bs, config.path);
    if (!Array.isArray(arr)) continue;

    for (const item of arr) {
      if (typeof item !== "object" || item === null) continue;
      const entry = item as SlugEntry;
      const slug = entry.slug;
      if (typeof slug !== "string" || slug === "") continue;

      const name = `--wp--preset--${config.presetType}--${toWpKebabCase(slug)}`;
      if (seen.has(name)) continue;
      seen.add(name);

      out.push({
        name,
        value: config.getValue(entry),
        category: config.category,
      });
    }
  }
}

/** Extract preset variables from an array at a given settings path. */
function extractPresetArray(
  settings: Record<string, unknown>,
  path: string[],
  presetType: string,
  category: string,
  getValue: (entry: SlugEntry) => string | undefined,
  out: CssVariable[],
): void {
  const arr = getNestedValue(settings, path);
  if (!Array.isArray(arr)) return;

  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const entry = item as SlugEntry;
    const slug = entry.slug;
    if (typeof slug !== "string" || slug === "") continue;

    out.push({
      name: `--wp--preset--${presetType}--${toWpKebabCase(slug)}`,
      value: getValue(entry),
      category,
    });
  }
}

/**
 * Recursively walk `settings.custom` and emit CSS variable entries.
 * Converts camelCase keys to kebab-case as WordPress does.
 */
function walkCustom(
  obj: Record<string, unknown>,
  segments: string[],
  out: CssVariable[],
): void {
  for (const [key, val] of Object.entries(obj)) {
    const kebab = toWpKebabCase(key);
    const newSegments = [...segments, kebab];

    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      walkCustom(val as Record<string, unknown>, newSegments, out);
    } else {
      const strValue = typeof val === "string" || typeof val === "number"
        ? String(val)
        : undefined;
      out.push({
        name: `--wp--custom--${newSegments.join("--")}`,
        value: strValue,
        category: "Custom",
      });
    }
  }
}

/**
 * Map from the array property name in theme.json to the CSS preset type.
 * e.g. `palette` → `color`, `fontFamilies` → `font-family`.
 */
/**
 * Map from the array property name (or parent.child key) in theme.json
 * to the CSS preset type.
 */
const PRESET_TYPE_MAP: Record<string, string> = {
  palette: "color",
  gradients: "gradient",
  duotone: "duotone",
  fontFamilies: "font-family",
  fontSizes: "font-size",
  spacingSizes: "spacing",
  aspectRatios: "aspect-ratio",
  // Nested paths where the array key alone is ambiguous
  "shadow.presets": "shadow",
};

/**
 * Build a `--wp--preset--{type}--{slug}` variable name from the array path
 * and the item's slug. Returns `null` if the path doesn't correspond to a
 * known preset array.
 *
 * @param path The store path to the array, e.g. `["settings", "color", "palette"]`
 * @param slug The item's slug value
 */
export function buildPresetCssVarName(path: string[], slug: string): string | null {
  if (!slug) return null;
  const arrayKey = path[path.length - 1];
  if (!arrayKey) return null;

  // Check single key first, then parent.child compound key
  const presetType = PRESET_TYPE_MAP[arrayKey]
    ?? (path.length >= 2
      ? PRESET_TYPE_MAP[`${path[path.length - 2]}.${arrayKey}`]
      : undefined);

  if (!presetType) return null;
  return `--wp--preset--${presetType}--${toWpKebabCase(slug)}`;
}

/*
 * Port of WordPress's `_wp_to_kebab_case()`, which core runs on preset slugs
 * and `settings.custom` keys when it generates the CSS custom properties.
 * Like lodash's `kebabCase`, it splits words at case changes, digits and
 * separators: `h1` → `h-1`, `2xl` → `2-xl`, `primary_dark` → `primary-dark`.
 */
const RS_LOWER_RANGE = "a-z\\xdf-\\xf6\\xf8-\\xff";
const RS_UPPER_RANGE = "A-Z\\xc0-\\xd6\\xd8-\\xde";
const RS_BREAK_RANGE =
  "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf" + // non-word characters
  "\\u2000-\\u206f" + // punctuation
  " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000-\\u200a\\u202f\\u205f\\u3000"; // spaces
const RS_BREAK = `[${RS_BREAK_RANGE}]`;
const RS_LOWER = `[${RS_LOWER_RANGE}]`;
const RS_UPPER = `[${RS_UPPER_RANGE}]`;
const RS_MISC = `[^${RS_BREAK_RANGE}\\d${RS_LOWER_RANGE}${RS_UPPER_RANGE}]`;
const RS_MISC_LOWER = `(?:${RS_LOWER}|${RS_MISC})`;
const RS_MISC_UPPER = `(?:${RS_UPPER}|${RS_MISC})`;
const RS_ORD_LOWER = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])";
const RS_ORD_UPPER = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])";
const WP_WORDS = new RegExp(
  [
    `${RS_UPPER}?${RS_LOWER}+(?=${RS_BREAK}|${RS_UPPER}|$)`,
    `${RS_MISC_UPPER}+(?=${RS_BREAK}|${RS_UPPER}${RS_MISC_LOWER}|$)`,
    `${RS_UPPER}?${RS_MISC_LOWER}+`,
    `${RS_UPPER}+`,
    RS_ORD_UPPER,
    RS_ORD_LOWER,
    "\\d+",
  ].join("|"),
  "gu",
);

/** Convert a theme.json key or slug to kebab-case the way WordPress does. */
export function toWpKebabCase(str: string): string {
  const words = str.replace(/'/g, "").match(WP_WORDS) ?? [];
  // PHP's strtolower() only folds ASCII letters.
  return words.join("-").replace(/[A-Z]/g, (c) => c.toLowerCase());
}

/**
 * Build the CSS custom property name from path segments.
 * `["lineHeight", "small"]` → `--wp--custom--line-height--small`
 */
export function buildCssVarName(segments: string[]): string {
  const kebab = segments.map(toWpKebabCase);
  return `--wp--custom--${kebab.join("--")}`;
}
