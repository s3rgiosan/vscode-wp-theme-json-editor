import { extractSchemaPropertyPaths } from "./schemaProperties";
import type { CoreScanSnapshot } from "../host/HostAdapter";
import { BLOCK_STYLE_VARIATION_ONLY_FLAG } from "../utils/fieldVisibility";

/**
 * `styles` keys that WordPress accepts only for blocks and block style
 * variations. `WP_Theme_JSON_Gutenberg::sanitize()` removes them from the root
 * and from elements. A block style variation partial keeps them at the root.
 */
const BLOCK_ONLY_STYLE_KEYS = ["transform"] as const;

/** Type of an injected leaf when the snapshot has no type for its path. */
const DEFAULT_LEAF_TYPE = "string";

/**
 * Types that get a typed field. A leaf of any other type, or of more than one
 * type, gets a JSON field, because the snapshot does not record the shape of
 * its items or properties.
 */
const SCALAR_TYPES = new Set(["boolean", "integer", "number", "string"]);

type SnapshotTypes = NonNullable<CoreScanSnapshot["types"]>;

/**
 * Merges the official WP theme.json schema with the core-scan snapshot.
 * Injects experimental properties, and core-supported properties the loaded
 * schema does not document, with custom flags so the UI can badge or hide them.
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
    const documented = extractSchemaPropertyPaths(schema);
    const undocumented = snapshot.properties.filter(
      (prop) => !documented.has(prop),
    );
    const parentPaths = this.collectParentPaths([
      ...snapshot.experimental,
      ...undocumented,
    ]);

    const types = snapshot.types ?? {};

    for (const prop of snapshot.experimental) {
      this.injectProperty(merged, prop, parentPaths, types, {
        "x-wpthemejsoneditor-experimental": true,
      });
    }

    for (const prop of undocumented) {
      this.injectProperty(merged, prop, parentPaths, types, {
        "x-wpthemejsoneditor-undocumented": true,
      });
    }

    this.scopeBlockOnlyStyles(merged);

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
    types: SnapshotTypes,
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
      properties[propertyName] = {
        ...this.createLeafSchema(types[dotPath]),
        ...flags,
      };
    }
  }

  /**
   * Build the schema of an injected leaf from the type the scan recorded.
   * A scalar type gets a typed field. An array, an object, or a mix of types
   * gets an untyped node that the UI edits as JSON, so any value passes
   * validation.
   */
  private createLeafSchema(
    type: SnapshotTypes[string] | undefined,
  ): Record<string, unknown> {
    if (type === undefined) {
      return { type: DEFAULT_LEAF_TYPE };
    }

    if (typeof type === "string" && SCALAR_TYPES.has(type)) {
      return { type };
    }

    return { "x-wpthemejsoneditor-json": true };
  }

  /**
   * Give each block-only style property a field in the per-block and
   * block style variation schemas, and flag the root copy so the UI shows it
   * only in a block style variation partial.
   */
  private scopeBlockOnlyStyles(schema: Record<string, unknown>): void {
    const styles = this.getChild(schema, "styles");
    if (!styles) {
      return;
    }

    const styleProperties = this.getOrCreateProperties(styles);
    const scopedSchemas = ["blocks", "variations"]
      .map((key) => this.getChild(styles, key))
      .map((stub) => stub?.["x-wpthemejsoneditor-block-schema"])
      .filter(
        (node): node is Record<string, unknown> =>
          typeof node === "object" && node !== null,
      );

    for (const key of BLOCK_ONLY_STYLE_KEYS) {
      const rootNode = styleProperties[key];
      if (typeof rootNode !== "object" || rootNode === null) {
        continue;
      }

      for (const scopedSchema of scopedSchemas) {
        const scopedProperties = this.getOrCreateProperties(scopedSchema);
        if (!scopedProperties[key]) {
          scopedProperties[key] = structuredClone(rootNode);
        }
      }

      (rootNode as Record<string, unknown>)[BLOCK_STYLE_VARIATION_ONLY_FLAG] =
        true;
    }
  }

  /**
   * Return the schema node of a direct child property, or undefined when the
   * child is missing or is not an object.
   */
  private getChild(
    node: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> | undefined {
    const properties = node["properties"];
    if (typeof properties !== "object" || properties === null) {
      return undefined;
    }

    const child = (properties as Record<string, unknown>)[key];
    if (typeof child !== "object" || child === null) {
      return undefined;
    }

    return child as Record<string, unknown>;
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
