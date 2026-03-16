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

      const name = `--wp--preset--${config.presetType}--${slug}`;
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
      name: `--wp--preset--${presetType}--${slug}`,
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
    const kebab = camelToKebab(key);
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
  return `--wp--preset--${presetType}--${slug}`;
}

/** Convert a camelCase string to kebab-case. */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/**
 * Build the CSS custom property name from path segments.
 * `["lineHeight", "small"]` → `--wp--custom--line-height--small`
 */
export function buildCssVarName(segments: string[]): string {
  const kebab = segments.map(camelToKebab);
  return `--wp--custom--${kebab.join("--")}`;
}
