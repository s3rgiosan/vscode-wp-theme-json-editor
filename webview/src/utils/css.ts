/**
 * Minify CSS for storage in theme.json.
 * Strips all unnecessary whitespace, newlines, and comments.
 * Preserves trailing semicolons.
 * Output: `.a{color:red;font-size:14px;}.b{margin:0;}`
 */
export function minifyCss(css: string): string {
  let result = css;
  // 1. Remove CSS comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  // 2. Collapse all whitespace into single spaces
  result = result.replace(/\s+/g, " ");
  // 3. Remove spaces around structural characters
  result = result.replace(/\s*{\s*/g, "{");
  result = result.replace(/\s*}\s*/g, "}");
  result = result.replace(/\s*;\s*/g, ";");
  result = result.replace(/\s*:\s*/g, ":");
  result = result.replace(/\s*,\s*/g, ",");
  return result.trim();
}

/**
 * Prettify CSS for display in the editor.
 * Always minifies first to ensure idempotent output regardless of input format.
 *
 * Input: `.a{color:red;}` or `.a { color: red; }`
 * Output:
 * ```css
 * .a {
 *   color: red;
 * }
 * ```
 */
export function prettifyCss(css: string): string {
  // Normalize to minified form first for consistent output
  const minified = minifyCss(css);
  if (!minified) {
    return "";
  }

  let result = "";
  let indent = 0;
  const tab = "  ";
  let inBlock = 0;

  for (let i = 0; i < minified.length; i++) {
    const ch = minified[i];

    if (ch === "{") {
      if (result.length > 0 && !/\s$/.test(result)) {
        result += " ";
      }
      result += "{\n";
      indent++;
      inBlock++;
      result += tab.repeat(indent);
    } else if (ch === "}") {
      result = result.trimEnd();
      result += "\n";
      indent = Math.max(0, indent - 1);
      inBlock = Math.max(0, inBlock - 1);
      result += tab.repeat(indent) + "}\n";
      if (indent === 0 && i + 1 < minified.length) {
        result += "\n";
      }
    } else if (ch === ";") {
      result += ";\n";
      if (i + 1 < minified.length && minified[i + 1] !== "}") {
        result += tab.repeat(indent);
      }
    } else if (ch === ":" && inBlock > 0) {
      result += ": ";
    } else {
      result += ch;
    }
  }

  return result.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
