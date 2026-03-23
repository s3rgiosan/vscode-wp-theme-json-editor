/**
 * Extracts all property paths from a resolved WordPress theme.json schema.
 * Used to populate the "known properties" set for the core scanner,
 * so that documented properties are not flagged as undocumented.
 */

type SchemaNode = Record<string, unknown>;

/**
 * Recursively walk a JSON schema and collect all dot-separated property paths.
 * Includes both leaf and intermediate paths (e.g. "settings" and "settings.color").
 */
export function extractSchemaPropertyPaths(
  schema: SchemaNode,
): Set<string> {
  const paths = new Set<string>();
  const properties = schema["properties"];
  if (typeof properties === "object" && properties !== null) {
    collectPaths(properties as Record<string, SchemaNode>, "", paths);
  }
  return paths;
}

function collectPaths(
  properties: Record<string, SchemaNode>,
  prefix: string,
  paths: Set<string>,
): void {
  for (const [key, value] of Object.entries(properties)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.add(path);

    if (typeof value !== "object" || value === null) {
      continue;
    }

    // Recurse into nested properties
    const nested = value["properties"];
    if (typeof nested === "object" && nested !== null) {
      collectPaths(nested as Record<string, SchemaNode>, path, paths);
    }

    // Handle items (array schemas)
    const items = value["items"];
    if (typeof items === "object" && items !== null) {
      const itemProps = (items as SchemaNode)["properties"];
      if (typeof itemProps === "object" && itemProps !== null) {
        collectPaths(itemProps as Record<string, SchemaNode>, path, paths);
      }
    }

    // Handle oneOf/anyOf — recurse into each variant
    for (const combiner of ["oneOf", "anyOf"] as const) {
      const arr = value[combiner];
      if (Array.isArray(arr)) {
        for (const variant of arr) {
          if (typeof variant === "object" && variant !== null) {
            const variantProps = (variant as SchemaNode)["properties"];
            if (typeof variantProps === "object" && variantProps !== null) {
              collectPaths(
                variantProps as Record<string, SchemaNode>,
                path,
                paths,
              );
            }
          }
        }
      }
    }
  }
}
