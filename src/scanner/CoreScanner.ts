/**
 * Scans WordPress core and Gutenberg source via the GitHub API to find
 * experimental and undocumented theme.json properties.
 *
 * Strategy:
 * 1. Parse the VALID_SETTINGS and VALID_STYLES class constants from the PHP
 *    source — these are the authoritative lists of allowed theme.json properties.
 * 2. Scan for __experimental* identifiers used as block support keys.
 * 3. Compare against the official JSON schema to find what is missing.
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
  readonly undocumented: string[];
}

/**
 * Scan WP core and Gutenberg source for experimental and undocumented
 * theme.json properties.
 */
export async function scanCore(
  schemaProperties: Set<string>,
  wpVersion: string,
): Promise<CoreScanResult> {
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

  // Properties found in core but not in the official schema
  const undocumented: string[] = [];
  for (const prop of allProperties) {
    if (!schemaProperties.has(prop) && !experimentalSet.has(prop)) {
      undocumented.push(prop);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    wpVersion,
    experimental: [...experimentalSet].sort(),
    undocumented: undocumented.sort(),
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
      }
    }
  }

  // Also add the prefix itself (the section path) unless it's a top-level key
  // that's already known
  if (!VALID_TOP_LEVEL_KEYS.has(prefix)) {
    allProperties.add(prefix);
  }
}
