/**
 * Get the schema version from a theme.json `$schema` URL: the release
 * (e.g. "6.7") for `/wp/<version>/theme.json`, or "trunk" for
 * `/trunk/theme.json`. Returns undefined for any other URL.
 */
export function parseSchemaVersion(schemaUrl: string): string | undefined {
  const match = /\/(?:wp\/([^/]+)|(trunk))\/theme\.json/.exec(schemaUrl);
  return match?.[1] ?? match?.[2];
}
