import { formatLabel } from "./formatLabel";

/**
 * A single search result pointing to a property in the schema tree.
 */
export interface SearchResult {
  /** Dot-separated path to the property (e.g. "settings.color.custom"). */
  path: string;
  /** Human-readable breadcrumb segments (e.g. ["Settings", "Color", "Custom"]). */
  breadcrumbs: string[];
  /** The matching property key. */
  key: string;
  /** Schema description, if available. */
  description?: string;
}

interface SchemaNode {
  type?: string;
  properties?: Record<string, SchemaNode>;
  description?: string;
  [key: string]: unknown;
}

/**
 * Recursively search a schema tree for properties matching a query string.
 * Matches against property keys, formatted labels, and descriptions.
 *
 * @param schema - The root schema object.
 * @param query - The search string (case-insensitive).
 * @param maxResults - Maximum number of results to return.
 * @returns An array of matching SearchResult objects.
 */
export function searchSchema(
  schema: Record<string, unknown>,
  query: string,
  maxResults: number = 50,
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  const root = schema as SchemaNode;

  if (root.properties) {
    for (const [key, node] of Object.entries(root.properties)) {
      walkSchema(key, node, [key], [formatLabel(key)], lowerQuery, results, maxResults);
      if (results.length >= maxResults) {
        break;
      }
    }
  }

  return results;
}

function walkSchema(
  key: string,
  node: SchemaNode,
  pathParts: string[],
  breadcrumbs: string[],
  query: string,
  results: SearchResult[],
  maxResults: number,
): void {
  if (results.length >= maxResults) {
    return;
  }

  // Skip block map stubs — their children aren't real schema properties
  if (node["x-wpthemejsoneditor-block-map"] === true) {
    return;
  }

  const label = formatLabel(key);
  const desc = typeof node.description === "string" ? node.description : "";

  // Check if this node matches
  const matches =
    key.toLowerCase().includes(query) ||
    label.toLowerCase().includes(query) ||
    desc.toLowerCase().includes(query);

  if (matches) {
    results.push({
      path: pathParts.join("."),
      breadcrumbs: [...breadcrumbs],
      key,
      description: desc || undefined,
    });
  }

  // Recurse into child properties
  if (node.properties && results.length < maxResults) {
    for (const [childKey, childNode] of Object.entries(node.properties)) {
      walkSchema(
        childKey,
        childNode,
        [...pathParts, childKey],
        [...breadcrumbs, formatLabel(childKey)],
        query,
        results,
        maxResults,
      );
      if (results.length >= maxResults) {
        break;
      }
    }
  }
}
