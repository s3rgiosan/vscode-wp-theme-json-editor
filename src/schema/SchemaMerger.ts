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

    for (const prop of snapshot.experimental) {
      this.injectProperty(merged, prop, {
        "x-wpthemejsoneditor-experimental": true,
      });
    }

    for (const prop of snapshot.undocumented) {
      this.injectProperty(merged, prop, {
        "x-wpthemejsoneditor-undocumented": true,
      });
    }

    return merged;
  }

  /**
   * Inject a property path into the schema's `properties` tree.
   * Path is dot-separated, e.g. "settings.color.experimentalProp".
   * If the intermediate objects don't exist, they are created.
   */
  private injectProperty(
    schema: Record<string, unknown>,
    dotPath: string,
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
    } else {
      // Property doesn't exist — create it with a permissive type
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
