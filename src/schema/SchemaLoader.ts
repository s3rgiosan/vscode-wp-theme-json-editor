import * as vscode from "vscode";

const SCHEMA_BASE_URL = "https://schemas.wp.org/wp";
const CACHE_KEY_PREFIX = "wpThemeJsonEditor.schemaCache";
const ETAG_KEY_PREFIX = "wpThemeJsonEditor.schemaEtag";
const FALLBACK_PATH = "src/schema/theme.json.fallback";

interface CachedSchema {
  readonly schema: Record<string, unknown>;
  readonly version: string;
}

/**
 * Loads and caches the official WordPress theme.json schema.
 * Falls back to a bundled copy when offline.
 */
export class SchemaLoader {
  private readonly globalState: vscode.Memento;
  private readonly extensionUri: vscode.Uri;

  constructor(globalState: vscode.Memento, extensionUri: vscode.Uri) {
    this.globalState = globalState;
    this.extensionUri = extensionUri;
  }

  /**
   * Load the schema for the given version.
   * Tries network first (with etag caching), then globalState cache, then bundled fallback.
   */
  async load(version: string): Promise<Record<string, unknown>> {
    const url = `${SCHEMA_BASE_URL}/${version}/theme.json`;
    const cacheKey = `${CACHE_KEY_PREFIX}.${version}`;
    const etagKey = `${ETAG_KEY_PREFIX}.${version}`;

    // Try fetching from network with etag
    try {
      const storedEtag = this.globalState.get<string>(etagKey);
      const headers: Record<string, string> = {};
      if (storedEtag) {
        headers["If-None-Match"] = storedEtag;
      }

      const response = await fetch(url, { headers });

      if (response.status === 304) {
        // Not modified — use cached version
        const cached = this.globalState.get<CachedSchema>(cacheKey);
        if (cached) {
          return cached.schema;
        }
      }

      if (response.ok) {
        const schema = (await response.json()) as Record<string, unknown>;
        const etag = response.headers.get("etag");

        // Cache the schema and etag
        await this.globalState.update(cacheKey, { schema, version });
        if (etag) {
          await this.globalState.update(etagKey, etag);
        }

        return schema;
      }
    } catch (err) {
      console.error("SchemaLoader: network fetch failed, trying cache", err);
    }

    // Try globalState cache
    const cached = this.globalState.get<CachedSchema>(cacheKey);
    if (cached) {
      return cached.schema;
    }

    // Fall back to bundled schema
    return this.loadFallback();
  }

  private async loadFallback(): Promise<Record<string, unknown>> {
    try {
      const fallbackUri = vscode.Uri.joinPath(this.extensionUri, FALLBACK_PATH);
      const raw = await vscode.workspace.fs.readFile(fallbackUri);
      const text = new TextDecoder("utf-8").decode(raw);
      return JSON.parse(text) as Record<string, unknown>;
    } catch (err) {
      console.error("SchemaLoader: failed to load fallback schema", err);
      return {};
    }
  }
}
