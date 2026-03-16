/**
 * Scans WordPress core source via the GitHub API to find experimental
 * and undocumented theme.json properties.
 *
 * This module is used by the `scripts/scan-core.ts` CLI script
 * and by the `wpThemeJsonEditor.refreshCoreScan` command.
 */

const GITHUB_API_BASE = "https://api.github.com";
const REPO = "WordPress/wordpress-develop";
const BRANCH = "trunk";

const CORE_FILES = [
  "src/wp-includes/class-wp-theme-json.php",
  "src/wp-includes/class-wp-theme-json-resolver.php",
  "src/wp-includes/theme.php",
] as const;

export interface CoreScanResult {
  readonly generatedAt: string;
  readonly wpVersion: string;
  readonly experimental: string[];
  readonly undocumented: string[];
}

/**
 * Scan WP core source for experimental and undocumented theme.json properties.
 */
export async function scanCore(
  schemaProperties: Set<string>,
  wpVersion: string,
): Promise<CoreScanResult> {
  const allProperties = new Set<string>();
  const experimentalProperties: string[] = [];

  for (const filePath of CORE_FILES) {
    try {
      const content = await fetchFileContent(filePath);
      extractProperties(content, allProperties, experimentalProperties);
    } catch (err) {
      console.error(`CoreScanner: failed to fetch ${filePath}`, err);
    }
  }

  // Properties found in core but not in the official schema
  const undocumented: string[] = [];
  for (const prop of allProperties) {
    if (!schemaProperties.has(prop) && !experimentalProperties.includes(prop)) {
      undocumented.push(prop);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    wpVersion,
    experimental: experimentalProperties,
    undocumented,
  };
}

async function fetchFileContent(filePath: string): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "vscode-wp-theme-json-editor",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${filePath}`);
  }

  return response.text();
}

/**
 * Extract theme.json property paths from PHP source code.
 */
function extractProperties(
  content: string,
  allProperties: Set<string>,
  experimentalProperties: string[],
): void {
  // Match array key access patterns like $theme_json['settings']['color']
  const arrayAccessPattern =
    /\$(?:theme_json|valid_\w+)\s*\[\s*'([^']+)'\s*\](?:\s*\[\s*'([^']+)'\s*\])?(?:\s*\[\s*'([^']+)'\s*\])?/g;

  let match: RegExpExecArray | null;
  while ((match = arrayAccessPattern.exec(content)) !== null) {
    const parts = [match[1], match[2], match[3]].filter(
      (p): p is string => typeof p === "string",
    );
    const path = parts.join(".");
    allProperties.add(path);
  }

  // Match experimental property names
  const experimentalPattern = /['"](_experimental[A-Za-z]+)['"]/g;
  while ((match = experimentalPattern.exec(content)) !== null) {
    if (match[1]) {
      experimentalProperties.push(match[1]);
    }
  }

  // Match valid_* array definitions for property lists
  const validArrayPattern =
    /\$valid_\w+\s*=\s*array\(\s*((?:'[^']+'\s*(?:,\s*)?)+)\)/g;
  while ((match = validArrayPattern.exec(content)) !== null) {
    if (match[1]) {
      const propPattern = /'([^']+)'/g;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propPattern.exec(match[1])) !== null) {
        if (propMatch[1]) {
          allProperties.add(propMatch[1]);
        }
      }
    }
  }
}
