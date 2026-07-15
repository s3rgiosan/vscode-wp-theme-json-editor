interface CoreScanSnapshot {
  readonly generatedAt: string;
  readonly wpVersion: string;
  readonly experimental: readonly string[];
  readonly undocumented: readonly string[];
}

/**
 * Merges the official WP theme.json schema with the core-scan snapshot.
 * Injects experimental/undocumented properties with custom flags so the
 * UI can badge or hide them.
 */
export class SchemaMerger {
  /**
   * Merge the official schema with the core-scan snapshot.
   * Returns a new schema object — does not mutate the input.
   */
  merge(
    schema: Record<string, unknown>,
    snapshot: CoreScanSnapshot,
  ): Record<string, unknown> {
    const merged = structuredClone(schema);
    const parentPaths = this.collectParentPaths([
      ...snapshot.experimental,
      ...snapshot.undocumented,
    ]);

    for (const prop of snapshot.experimental) {
      this.injectProperty(merged, prop, parentPaths, {
        "x-wpthemejsoneditor-experimental": true,
      });
    }

    for (const prop of snapshot.undocumented) {
      this.injectProperty(merged, prop, parentPaths, {
        "x-wpthemejsoneditor-undocumented": true,
      });
    }

    return merged;
  }

  /**
   * Collect every path that is a strict dot-boundary prefix of another path.
   * These must be typed as objects so the renderer descends into their children
   * (e.g. "settings.viewport" is a parent of "settings.viewport.mobile").
   */
  private collectParentPaths(paths: readonly string[]): Set<string> {
    const parents = new Set<string>();
    for (const path of paths) {
      const parts = path.split(".");
      // Every proper ancestor prefix of this path is a parent.
      for (let i = 1; i < parts.length; i++) {
        parents.add(parts.slice(0, i).join("."));
      }
    }
    return parents;
  }

  /**
   * Inject a property path into the schema's `properties` tree.
   * Path is dot-separated, e.g. "settings.color.experimentalProp".
   * If the intermediate objects don't exist, they are created.
   */
  private injectProperty(
    schema: Record<string, unknown>,
    dotPath: string,
    parentPaths: Set<string>,
    flags: Record<string, boolean>,
  ): void {
    const parts = dotPath.split(".");
    if (parts.length === 0) {
      return;
    }

    const propertyName = parts.pop();
    if (!propertyName) {
      return;
    }

    let current = schema;

    // Navigate to the correct nesting level in the schema's properties tree
    for (const part of parts) {
      const properties = this.getOrCreateProperties(current);
      if (!properties[part]) {
        properties[part] = { type: "object", properties: {} };
      }
      const node = properties[part];
      if (typeof node !== "object" || node === null) {
        return;
      }
      current = node as Record<string, unknown>;
    }

    const properties = this.getOrCreateProperties(current);

    if (properties[propertyName]) {
      // Property already exists — just add the flags
      const existing = properties[propertyName];
      if (typeof existing === "object" && existing !== null) {
        Object.assign(existing, flags);
      }
    } else if (parentPaths.has(dotPath)) {
      // Property has descendants in the snapshot — type it as an object so the
      // renderer descends into its children instead of showing a text input.
      properties[propertyName] = {
        type: "object",
        properties: {},
        ...flags,
      };
    } else {
      // Leaf property — create it with a permissive type
      properties[propertyName] = {
        type: "string",
        ...flags,
      };
    }
  }

  private getOrCreateProperties(
    node: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!node["properties"]) {
      node["properties"] = {};
    }
    return node["properties"] as Record<string, unknown>;
  }
}
