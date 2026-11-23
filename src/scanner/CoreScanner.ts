/**
 * Scans WordPress core and Gutenberg source via the GitHub API to find
 * every supported theme.json property and experimental block support keys.
 *
 * Strategy:
 * 1. Parse the VALID_SETTINGS and VALID_STYLES class constants from the PHP
 *    source — these are the authoritative lists of allowed theme.json properties.
 * 2. Scan for __experimental* identifiers used as block support keys.
 * 3. Read the type of each leaf property from the Gutenberg theme.json schema,
 *    so the editor gives an undocumented property the right field.
 *
 * The editor compares the supported properties against the schema it loads
 * and flags those the schema does not document.
 *
 * This module is used by the `scripts/scan-core.ts` CLI script
 * and by the `wpThemeJsonEditor.refreshCoreScan` command.
 */

const GITHUB_API_BASE = "https://api.github.com";

interface RepoConfig {
  readonly repo: string;
  readonly branch: string;
  readonly files: readonly string[];
}

const REPOS: readonly RepoConfig[] = [
  {
    repo: "WordPress/wordpress-develop",
    branch: "trunk",
    files: [
      "src/wp-includes/class-wp-theme-json.php",
      "src/wp-includes/class-wp-theme-json-resolver.php",
    ],
  },
  {
    repo: "WordPress/gutenberg",
    branch: "trunk",
    files: [
      "lib/class-wp-theme-json-gutenberg.php",
      "lib/class-wp-theme-json-resolver-gutenberg.php",
    ],
  },
];

/** JSON schema that documents the types of the scanned properties. */
const TYPE_SOURCE = {
  repo: "WordPress/gutenberg",
  branch: "trunk",
  file: "schemas/json/theme.json",
} as const;

/**
 * Top-level theme.json keys that are structural (not leaf properties).
 * These should never be flagged as undocumented.
 */
const VALID_TOP_LEVEL_KEYS = new Set([
  "blockTypes",
  "customTemplates",
  "description",
  "patterns",
  "settings",
  "slug",
  "styles",
  "templateParts",
  "title",
  "version",
]);

export interface CoreScanResult {
  readonly generatedAt: string;
  readonly wpVersion: string;
  readonly experimental: string[];
  readonly properties: string[];
  /** JSON schema type of each leaf property path, where the schema has one. */
  readonly types: Record<string, string>;
}

type SchemaNode = Record<string, unknown>;

/**
 * Scan WP core and Gutenberg source for supported and experimental
 * theme.json properties.
 */
export async function scanCore(wpVersion: string): Promise<CoreScanResult> {
  const allProperties = new Set<string>();
  const experimentalSet = new Set<string>();

  for (const repo of REPOS) {
    for (const filePath of repo.files) {
      try {
        const content = await fetchFileContent(
          repo.repo,
          repo.branch,
          filePath,
        );
        extractProperties(content, allProperties, experimentalSet);
      } catch (err) {
        console.error(
          `CoreScanner: failed to fetch ${repo.repo}/${filePath}`,
          err,
        );
      }
    }
  }

  const properties = [...allProperties].sort();

  let types: Record<string, string> = {};
  try {
    const content = await fetchFileContent(
      TYPE_SOURCE.repo,
      TYPE_SOURCE.branch,
      TYPE_SOURCE.file,
    );
    types = extractPropertyTypes(JSON.parse(content) as SchemaNode, properties);
  } catch (err) {
    console.error(
      `CoreScanner: failed to read types from ${TYPE_SOURCE.repo}/${TYPE_SOURCE.file}`,
      err,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    wpVersion,
    experimental: [...experimentalSet].sort(),
    properties,
    types,
  };
}

async function fetchFileContent(
  repo: string,
  branch: string,
  filePath: string,
): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
    "User-Agent": "vscode-wp-theme-json-editor",
  };

  // Use GITHUB_TOKEN if available (avoids rate limiting in CI)
  const token =
    typeof process !== "undefined" ? process.env["GITHUB_TOKEN"] : undefined;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${filePath}`);
  }

  return response.text();
}

/**
 * Extract theme.json property paths from PHP source code.
 *
 * Focuses on two reliable sources:
 * 1. VALID_SETTINGS / VALID_STYLES class constants — nested associative arrays
 *    that define the allowed theme.json structure.
 * 2. __experimental* identifiers used as block support feature keys.
 */
export function extractProperties(
  content: string,
  allProperties: Set<string>,
  experimentalProperties: Set<string>,
): void {
  // 1. Extract from VALID_SETTINGS and VALID_STYLES constants
  extractValidConstants(content, "settings", allProperties);
  extractValidConstants(content, "styles", allProperties);

  // 2. Extract __experimental* property names used as theme.json keys
  const experimentalPattern = /['"](__experimental[A-Za-z_]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = experimentalPattern.exec(content)) !== null) {
    if (match[1]) {
      experimentalProperties.add(match[1]);
    }
  }
}

/**
 * Parse a VALID_SETTINGS or VALID_STYLES constant and extract all property
 * paths as dot-separated strings prefixed with "settings." or "styles.".
 */
function extractValidConstants(
  content: string,
  section: "settings" | "styles",
  allProperties: Set<string>,
): void {
  const constName =
    section === "settings" ? "VALID_SETTINGS" : "VALID_STYLES";

  // Match the constant definition — handles both `const X = array(...)` and
  // multi-line definitions. Uses a balanced-parentheses approach.
  const constStart = content.indexOf(`${constName} = array(`);
  if (constStart === -1) {
    return;
  }

  // Find the matching closing paren by counting nesting depth
  const arrayStart = content.indexOf("array(", constStart) + 6;
  let depth = 1;
  let pos = arrayStart;
  while (pos < content.length && depth > 0) {
    if (content[pos] === "(") {
      depth++;
    } else if (content[pos] === ")") {
      depth--;
    }
    pos++;
  }

  const arrayBody = content.slice(arrayStart, pos - 1);
  parseNestedArray(arrayBody, section, allProperties);
}

/**
 * Parse the body of a PHP associative array and extract dot-separated
 * property paths. Handles nested `array(...)` values.
 *
 * Example input (body of VALID_SETTINGS):
 *   'background' => array(
 *       'backgroundImage' => null,
 *       'backgroundSize'  => null,
 *   ),
 *   'custom' => null,
 *
 * Produces: settings.background, settings.background.backgroundImage, etc.
 */
function parseNestedArray(
  body: string,
  prefix: string,
  allProperties: Set<string>,
): void {
  // Match top-level keys: 'keyName' => (null | array(...))
  const keyPattern = /'([^']+)'\s*=>/g;
  let match: RegExpExecArray | null;

  while ((match = keyPattern.exec(body)) !== null) {
    const key = match[1];
    if (!key) continue;

    const path = `${prefix}.${key}`;
    allProperties.add(path);

    // Check if the value is a nested array
    const afterArrow = body.slice(match.index + match[0].length).trimStart();
    if (afterArrow.startsWith("array(")) {
      // Find the matching closing paren
      const nestedStart = body.indexOf(
        "array(",
        match.index + match[0].length,
      );
      if (nestedStart !== -1) {
        const innerStart = nestedStart + 6;
        let depth = 1;
        let pos = innerStart;
        while (pos < body.length && depth > 0) {
          if (body[pos] === "(") {
            depth++;
          } else if (body[pos] === ")") {
            depth--;
          }
          pos++;
        }
        const nestedBody = body.slice(innerStart, pos - 1);
        parseNestedArray(nestedBody, path, allProperties);

        // Resume after the nested array so its keys are not read again at this level.
        keyPattern.lastIndex = pos;
      }
    }
  }

  // Also add the prefix itself (the section path) unless it's a top-level key
  // that's already known
  if (!VALID_TOP_LEVEL_KEYS.has(prefix)) {
    allProperties.add(prefix);
  }
}

/**
 * Read the JSON schema type of each leaf path from a theme.json schema.
 * A leaf is a path that is not the parent of another path in the list.
 * Paths the schema does not document, or documents without a clear type,
 * are left out.
 *
 * @param schema Unresolved theme.json schema, with `$ref` and `allOf`.
 * @param paths  Dot-separated property paths, e.g. "settings.color.custom".
 */
export function extractPropertyTypes(
  schema: SchemaNode,
  paths: readonly string[],
): Record<string, string> {
  const definitions = isSchemaNode(schema["definitions"])
    ? (schema["definitions"] as Record<string, SchemaNode>)
    : {};
  const parents = new Set(
    paths.flatMap((path) => {
      const parts = path.split(".");
      return parts.slice(1).map((_, i) => parts.slice(0, i + 1).join("."));
    }),
  );

  const types: Record<string, string> = {};
  for (const path of paths) {
    if (parents.has(path)) {
      continue;
    }

    const node = findSchemaNode(schema, path.split("."), definitions);
    const type = node ? getNodeType(node, definitions) : undefined;
    if (type) {
      types[path] = type;
    }
  }

  return types;
}

/**
 * Walk the `properties` tree to the node at a path, following `$ref` and
 * `allOf` at each step.
 */
function findSchemaNode(
  schema: SchemaNode,
  parts: readonly string[],
  definitions: Record<string, SchemaNode>,
): SchemaNode | undefined {
  let current: SchemaNode | undefined = schema;
  for (const part of parts) {
    if (!current) {
      return undefined;
    }
    current = collectProperties(current, definitions)[part];
  }
  return current;
}

/**
 * Collect the object-valued child properties of a node across its `$ref`
 * and `allOf` branches. A later branch does not replace a child with a
 * non-object value, such as the `false` that some branches use to exclude a
 * property.
 */
function collectProperties(
  node: SchemaNode,
  definitions: Record<string, SchemaNode>,
  seen: Set<SchemaNode> = new Set(),
): Record<string, SchemaNode> {
  const target = dereference(node, definitions);
  if (seen.has(target)) {
    return {};
  }
  seen.add(target);

  const collected: Record<string, SchemaNode> = {};

  const allOf = target["allOf"];
  if (Array.isArray(allOf)) {
    for (const entry of allOf) {
      if (isSchemaNode(entry)) {
        Object.assign(collected, collectProperties(entry, definitions, seen));
      }
    }
  }

  const own = target["properties"];
  if (isSchemaNode(own)) {
    for (const [key, value] of Object.entries(own)) {
      if (isSchemaNode(value)) {
        collected[key] = value;
      }
    }
  }

  return collected;
}

/**
 * Return the JSON schema type of a node: its own `type`, else the first
 * non-object type of a `oneOf`/`anyOf`/`allOf` option, else "object" when it
 * declares properties.
 */
function getNodeType(
  node: SchemaNode,
  definitions: Record<string, SchemaNode>,
  seen: Set<SchemaNode> = new Set(),
): string | undefined {
  const target = dereference(node, definitions);
  if (seen.has(target)) {
    return undefined;
  }
  seen.add(target);

  const ownType = target["type"];
  if (typeof ownType === "string") {
    return ownType;
  }

  for (const combiner of ["oneOf", "anyOf", "allOf"] as const) {
    const options = target[combiner];
    if (!Array.isArray(options)) {
      continue;
    }
    for (const option of options) {
      if (!isSchemaNode(option)) {
        continue;
      }
      const optionType = getNodeType(option, definitions, seen);
      if (optionType && optionType !== "object") {
        return optionType;
      }
    }
  }

  const hasProperties =
    isSchemaNode(target["properties"]) ||
    isSchemaNode(target["additionalProperties"]);
  return hasProperties ? "object" : undefined;
}

/** Follow a local `#/definitions/...` reference, or return the node itself. */
function dereference(
  node: SchemaNode,
  definitions: Record<string, SchemaNode>,
): SchemaNode {
  const ref = node["$ref"];
  const prefix = "#/definitions/";
  if (typeof ref !== "string" || !ref.startsWith(prefix)) {
    return node;
  }

  const definition = definitions[ref.slice(prefix.length)];
  return isSchemaNode(definition) ? definition : node;
}

function isSchemaNode(value: unknown): value is SchemaNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
