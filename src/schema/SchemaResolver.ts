/**
 * Resolves $ref and allOf in a JSON Schema, producing a self-contained
 * schema with inline properties that the webview can walk directly.
 *
 * Only handles the patterns used by the WordPress theme.json schema:
 * - $ref with local pointers (#/definitions/...)
 * - allOf as a list of $ref and/or inline objects
 *
 * Per-block properties (settings.blocks.*, styles.blocks.*, styles.variations.*)
 * are kept as lightweight stubs to avoid a 40MB+ resolved schema.
 */

type SchemaNode = Record<string, unknown>;

/**
 * Property keys whose children are per-block expansions that should
 * not be eagerly resolved. Each child is a block name (e.g. "core/paragraph")
 * pointing to the full settings or styles schema — resolving all of them
 * produces tens of megabytes of duplicated data.
 */
const BLOCK_MAP_KEYS = new Set(["blocks", "variations"]);

export class SchemaResolver {
  private readonly definitions: Record<string, SchemaNode>;
  private readonly resolving = new Set<string>();

  constructor(rootSchema: SchemaNode) {
    this.definitions =
      typeof rootSchema["definitions"] === "object" &&
      rootSchema["definitions"] !== null
        ? (rootSchema["definitions"] as Record<string, SchemaNode>)
        : {};
  }

  /**
   * Resolve the full schema, returning a new object with all $ref and allOf inlined.
   */
  resolve(schema: SchemaNode): SchemaNode {
    return this.resolveNode(schema, []);
  }

  private resolveNode(node: SchemaNode, path: string[]): SchemaNode {
    if (typeof node !== "object" || node === null) {
      return node;
    }

    // Handle $ref
    const ref = node["$ref"];
    if (typeof ref === "string") {
      const resolved = this.resolveRef(ref, path);
      // Merge any sibling properties (description, etc.) with the resolved ref
      const siblings = { ...node };
      delete siblings["$ref"];
      if (Object.keys(siblings).length > 0) {
        return this.mergeObjects(resolved, siblings);
      }
      return resolved;
    }

    // Handle allOf — merge all entries into a single object
    const allOf = node["allOf"];
    if (Array.isArray(allOf)) {
      let merged: SchemaNode = {};
      // Copy non-allOf properties first
      for (const [key, value] of Object.entries(node)) {
        if (key !== "allOf") {
          merged[key] = value;
        }
      }
      for (const entry of allOf) {
        if (typeof entry === "object" && entry !== null) {
          const resolved = this.resolveNode(entry as SchemaNode, path);
          merged = this.mergeObjects(merged, resolved);
        }
      }
      return merged;
    }

    // Handle oneOf/anyOf — resolve each entry but keep the structure
    for (const combiner of ["oneOf", "anyOf"] as const) {
      const arr = node[combiner];
      if (Array.isArray(arr)) {
        const result = { ...node };
        result[combiner] = arr.map((entry) => {
          if (typeof entry === "object" && entry !== null) {
            return this.resolveNode(entry as SchemaNode, path);
          }
          return entry;
        });
        return this.resolveProperties(result, path);
      }
    }

    return this.resolveProperties(node, path);
  }

  private resolveProperties(node: SchemaNode, path: string[]): SchemaNode {
    const result: SchemaNode = {};

    for (const [key, value] of Object.entries(node)) {
      if (key === "definitions") {
        continue;
      }

      if (key === "properties" && typeof value === "object" && value !== null) {
        const props: Record<string, unknown> = {};
        for (const [propKey, propValue] of Object.entries(
          value as Record<string, unknown>,
        )) {
          if (typeof propValue === "object" && propValue !== null) {
            // Check if this is a per-block map that should be stubbed
            if (this.shouldStub(propKey, path)) {
              props[propKey] = this.createBlockMapStub(
                propValue as SchemaNode,
              );
            } else {
              props[propKey] = this.resolveNode(
                propValue as SchemaNode,
                [...path, propKey],
              );
            }
          } else {
            props[propKey] = propValue;
          }
        }
        result[key] = props;
      } else if (
        key === "items" &&
        typeof value === "object" &&
        value !== null
      ) {
        result[key] = this.resolveNode(value as SchemaNode, [...path, "items"]);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Determine whether a property should be stubbed instead of fully resolved.
   * We stub "blocks" and "variations" when they're direct children of
   * settings or styles (depth 1 in the top-level property tree).
   */
  private shouldStub(propKey: string, path: string[]): boolean {
    if (!BLOCK_MAP_KEYS.has(propKey)) {
      return false;
    }
    // path represents the schema walk so far within "properties".
    // We want to stub when the parent is a top-level section like settings/styles.
    // After resolution, path looks like: [] at root, ["settings"] inside settings, etc.
    // The propKey "blocks" at path ["settings"] means settings.blocks.
    if (path.length >= 1) {
      const parent = path[path.length - 1];
      return parent === "settings" || parent === "styles";
    }
    return false;
  }

  /**
   * Create a lightweight stub for a per-block map. Preserves the top-level
   * description and type but replaces per-block properties with a list of
   * block names the UI can use for a selector.
   */
  private createBlockMapStub(node: SchemaNode): SchemaNode {
    // If the node is a $ref, peek at the definition to get block names
    const resolved = this.peekDefinition(node);

    const stub: SchemaNode = {
      type: "object",
      "x-wpthemejsoneditor-block-map": true,
    };

    const desc = resolved["description"] ?? node["description"];
    if (typeof desc === "string") {
      stub["description"] = desc;
    }

    // Collect block names and resolve the per-block schema (shared by all blocks)
    const props = resolved["properties"];
    if (typeof props === "object" && props !== null) {
      const entries = Object.entries(props as Record<string, unknown>);
      stub["x-wpthemejsoneditor-block-names"] = entries.map(([k]) => k);

      // All blocks share the same ref — resolve just the first one.
      // Use a fake path ["settings"] so nested blocks/variations get stubbed
      // and don't explode the schema size.
      if (entries.length > 0) {
        const [, firstBlockSchema] = entries[0];
        if (typeof firstBlockSchema === "object" && firstBlockSchema !== null) {
          const blockSchemaResolved = this.resolveNode(
            firstBlockSchema as SchemaNode,
            ["settings"],
          );
          // Strip nested block map stubs — they're not useful at per-block level
          const blockProps = blockSchemaResolved["properties"];
          if (typeof blockProps === "object" && blockProps !== null) {
            const filtered: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(
              blockProps as Record<string, unknown>,
            )) {
              if (k === "blocks" || k === "variations") {
                continue;
              }
              filtered[k] = v;
            }
            blockSchemaResolved["properties"] = filtered;
          }
          stub["x-wpthemejsoneditor-block-schema"] = blockSchemaResolved;
        }
      }
    }

    // Handle patternProperties (used by styles.variations — free-form keys)
    const patternProps = resolved["patternProperties"];
    if (typeof patternProps === "object" && patternProps !== null && !props) {
      stub["x-wpthemejsoneditor-free-form"] = true;

      // Resolve the first pattern schema as the per-item schema.
      // Use fake path to trigger stubbing of nested block maps.
      const patternEntries = Object.values(
        patternProps as Record<string, unknown>,
      );
      if (patternEntries.length > 0) {
        const firstPattern = patternEntries[0];
        if (typeof firstPattern === "object" && firstPattern !== null) {
          const patternResolved = this.resolveNode(
            firstPattern as SchemaNode,
            ["styles"],
          );
          // Strip nested block/variation stubs
          const patternProps2 = patternResolved["properties"];
          if (typeof patternProps2 === "object" && patternProps2 !== null) {
            const filtered: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(
              patternProps2 as Record<string, unknown>,
            )) {
              if (k === "blocks" || k === "variations") {
                continue;
              }
              filtered[k] = v;
            }
            patternResolved["properties"] = filtered;
          }
          stub["x-wpthemejsoneditor-block-schema"] = patternResolved;
        }
      }
    }

    return stub;
  }

  /**
   * Shallow peek at a $ref without fully resolving it.
   * Used to extract metadata (like property keys) without expanding the full tree.
   */
  private peekDefinition(node: SchemaNode): SchemaNode {
    const ref = node["$ref"];
    if (typeof ref !== "string") {
      return node;
    }
    const prefix = "#/definitions/";
    if (!ref.startsWith(prefix)) {
      return node;
    }
    const defName = ref.slice(prefix.length);
    const definition = this.definitions[defName];
    if (!definition || typeof definition !== "object") {
      return node;
    }
    return definition;
  }

  private resolveRef(ref: string, path: string[]): SchemaNode {
    const prefix = "#/definitions/";
    if (!ref.startsWith(prefix)) {
      return {};
    }

    const defName = ref.slice(prefix.length);

    if (this.resolving.has(defName)) {
      return {};
    }

    const definition = this.definitions[defName];
    if (!definition || typeof definition !== "object") {
      return {};
    }

    this.resolving.add(defName);
    const resolved = this.resolveNode(definition, path);
    this.resolving.delete(defName);

    return resolved;
  }

  /**
   * Deep-merge two schema objects. Properties from `b` override `a`,
   * except for `properties` which are merged recursively.
   */
  private mergeObjects(a: SchemaNode, b: SchemaNode): SchemaNode {
    const result: SchemaNode = { ...a };

    for (const [key, bValue] of Object.entries(b)) {
      if (
        key === "properties" &&
        typeof result[key] === "object" &&
        result[key] !== null &&
        typeof bValue === "object" &&
        bValue !== null
      ) {
        result[key] = {
          ...(result[key] as Record<string, unknown>),
          ...(bValue as Record<string, unknown>),
        };
      } else if (
        key === "required" &&
        Array.isArray(result[key]) &&
        Array.isArray(bValue)
      ) {
        result[key] = [
          ...new Set([...(result[key] as string[]), ...(bValue as string[])]),
        ];
      } else {
        result[key] = bValue;
      }
    }

    return result;
  }
}
