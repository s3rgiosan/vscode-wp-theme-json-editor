import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../SchemaMerger";

/** Walk the `properties` tree of a schema to the node at a path. */
function getNode(
  schema: Record<string, unknown>,
  path: readonly string[],
): Record<string, unknown> {
  let node = schema;
  for (const key of path) {
    node = (node["properties"] as Record<string, unknown>)[key] as Record<
      string,
      unknown
    >;
  }
  return node;
}

describe("SchemaMerger", () => {
  const merger = new SchemaMerger();

  it("injects experimental properties", () => {
    const schema = {
      properties: {
        settings: {
          type: "object",
          properties: {
            color: { type: "object", properties: {} },
          },
        },
      },
    };

    const snapshot = {
      generatedAt: "2025-01-01",
      wpVersion: "6.7",
      experimental: ["settings.color.experimentalProp"],
      properties: [],
    };

    const merged = merger.merge(schema, snapshot);
    const color = (
      (merged["properties"] as Record<string, unknown>)["settings"] as Record<string, unknown>
    )["properties"] as Record<string, unknown>;
    const colorProps = (color["color"] as Record<string, unknown>)["properties"] as Record<string, unknown>;
    const prop = colorProps["experimentalProp"] as Record<string, unknown>;

    expect(prop).toBeDefined();
    expect(prop["x-wpthemejsoneditor-experimental"]).toBe(true);
  });

  it("injects undocumented properties", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: ["myProp"],
    };

    const merged = merger.merge(schema, snapshot);
    const props = (merged["properties"] as Record<string, unknown>);
    const prop = props["myProp"] as Record<string, unknown>;

    expect(prop).toBeDefined();
    expect(prop["x-wpthemejsoneditor-undocumented"]).toBe(true);
  });

  it("leaves properties the schema already documents unflagged", () => {
    const schema = {
      properties: {
        settings: {
          type: "object",
          properties: {
            dimensions: {
              type: "object",
              properties: {
                width: { type: "boolean" },
              },
            },
          },
        },
      },
    };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: [
        "settings.dimensions",
        "settings.dimensions.width",
        "settings.dimensions.height",
      ],
    };

    const merged = merger.merge(schema, snapshot);
    const settingsProps = (
      (merged["properties"] as Record<string, unknown>)[
        "settings"
      ] as Record<string, unknown>
    )["properties"] as Record<string, unknown>;
    const dimensions = settingsProps["dimensions"] as Record<string, unknown>;
    const dimensionsProps = dimensions["properties"] as Record<string, unknown>;
    const width = dimensionsProps["width"] as Record<string, unknown>;
    const height = dimensionsProps["height"] as Record<string, unknown>;

    expect(dimensions["x-wpthemejsoneditor-undocumented"]).toBeUndefined();
    expect(width["type"]).toBe("boolean");
    expect(width["x-wpthemejsoneditor-undocumented"]).toBeUndefined();
    expect(height["x-wpthemejsoneditor-undocumented"]).toBe(true);
  });

  it("types an undocumented path with descendants as an object", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: [
        "settings.viewport",
        "settings.viewport.mobile",
        "settings.viewport.tablet",
      ],
    };

    const merged = merger.merge(schema, snapshot);
    const settingsProps = (
      (
        (merged["properties"] as Record<string, unknown>)[
          "settings"
        ] as Record<string, unknown>
      )["properties"] as Record<string, unknown>
    );
    const viewport = settingsProps["viewport"] as Record<string, unknown>;

    expect(viewport["type"]).toBe("object");
    expect(viewport["x-wpthemejsoneditor-undocumented"]).toBe(true);

    const viewportProps = viewport["properties"] as Record<string, unknown>;
    const mobile = viewportProps["mobile"] as Record<string, unknown>;
    const tablet = viewportProps["tablet"] as Record<string, unknown>;

    expect(mobile).toBeDefined();
    expect(mobile["type"]).toBe("string");
    expect(mobile["x-wpthemejsoneditor-undocumented"]).toBe(true);
    expect(tablet).toBeDefined();
    expect(tablet["type"]).toBe("string");
  });

  it("keeps an undocumented leaf without descendants as a string", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: ["settings.mobile", "settings.tablet"],
    };

    const merged = merger.merge(schema, snapshot);
    const settingsProps = (
      (
        (merged["properties"] as Record<string, unknown>)[
          "settings"
        ] as Record<string, unknown>
      )["properties"] as Record<string, unknown>
    );
    const mobile = settingsProps["mobile"] as Record<string, unknown>;

    expect(mobile["type"]).toBe("string");
    expect(mobile["x-wpthemejsoneditor-undocumented"]).toBe(true);
  });

  it("types a parent as an object regardless of injection order", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      // Child listed before the parent leaf.
      properties: ["settings.viewport.mobile", "settings.viewport"],
    };

    const merged = merger.merge(schema, snapshot);
    const settingsProps = (
      (
        (merged["properties"] as Record<string, unknown>)[
          "settings"
        ] as Record<string, unknown>
      )["properties"] as Record<string, unknown>
    );
    const viewport = settingsProps["viewport"] as Record<string, unknown>;

    expect(viewport["type"]).toBe("object");
    expect(viewport["x-wpthemejsoneditor-undocumented"]).toBe(true);
    const viewportProps = viewport["properties"] as Record<string, unknown>;
    expect(viewportProps["mobile"]).toBeDefined();
  });

  it("types an undocumented leaf with the type the snapshot records", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: [
        "settings.transform",
        "settings.transform.rotate",
        "settings.transform.label",
      ],
      types: { "settings.transform.rotate": "boolean" },
    };

    const merged = merger.merge(schema, snapshot);
    const transform = getNode(merged, ["settings", "transform"]);
    const transformProps = transform["properties"] as Record<string, unknown>;
    const rotate = transformProps["rotate"] as Record<string, unknown>;
    const label = transformProps["label"] as Record<string, unknown>;

    expect(transform["type"]).toBe("object");
    expect(rotate["type"]).toBe("boolean");
    expect(rotate["x-wpthemejsoneditor-undocumented"]).toBe(true);
    expect(label["type"]).toBe("string");
  });

  it("injects array, object and mixed-type leaves as JSON fields", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: [
        "settings.typography",
        "settings.typography.textShadowPresets",
        "settings.typography.textIndent",
        "settings.typography.fluidPresets",
        "settings.typography.fontSize",
      ],
      types: {
        "settings.typography.textShadowPresets": "array",
        "settings.typography.textIndent": ["boolean", "string"],
        "settings.typography.fluidPresets": "object",
        "settings.typography.fontSize": "number",
      },
    };

    const merged = merger.merge(schema, snapshot);
    const typography = getNode(merged, ["settings", "typography"]);
    const props = typography["properties"] as Record<
      string,
      Record<string, unknown>
    >;

    for (const key of ["textShadowPresets", "textIndent", "fluidPresets"]) {
      expect(props[key]?.["x-wpthemejsoneditor-json"]).toBe(true);
      expect(props[key]?.["type"]).toBeUndefined();
      expect(props[key]?.["x-wpthemejsoneditor-undocumented"]).toBe(true);
    }
    expect(props["fontSize"]?.["type"]).toBe("number");
  });

  describe("block-only styles", () => {
    const blockOnlySnapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      properties: ["styles.transform", "styles.transform.rotate"],
    };

    function stylesSchema(): Record<string, unknown> {
      return {
        properties: {
          styles: {
            type: "object",
            properties: {
              color: { type: "object", properties: {} },
              blocks: {
                type: "object",
                "x-wpthemejsoneditor-block-map": true,
                "x-wpthemejsoneditor-block-schema": {
                  type: "object",
                  properties: { color: { type: "object", properties: {} } },
                },
              },
              variations: {
                type: "object",
                "x-wpthemejsoneditor-block-map": true,
                "x-wpthemejsoneditor-free-form": true,
                "x-wpthemejsoneditor-block-schema": {
                  type: "object",
                  properties: { color: { type: "object", properties: {} } },
                },
              },
            },
          },
        },
      };
    }

    function blockSchemaProps(
      merged: Record<string, unknown>,
      map: "blocks" | "variations",
    ): Record<string, unknown> {
      const stub = getNode(merged, ["styles", map]);
      const blockSchema = stub["x-wpthemejsoneditor-block-schema"] as Record<
        string,
        unknown
      >;
      return blockSchema["properties"] as Record<string, unknown>;
    }

    it("flags the root copy as block style variation only", () => {
      const merged = merger.merge(stylesSchema(), blockOnlySnapshot);
      const transform = getNode(merged, ["styles", "transform"]);

      expect(transform["x-wpthemejsoneditor-block-style-variation-only"]).toBe(
        true,
      );
      expect(transform["x-wpthemejsoneditor-undocumented"]).toBe(true);
    });

    it("adds the property to the per-block and variation schemas", () => {
      const merged = merger.merge(stylesSchema(), blockOnlySnapshot);

      for (const map of ["blocks", "variations"] as const) {
        const transform = blockSchemaProps(merged, map)["transform"] as Record<
          string,
          unknown
        >;
        const rotate = (transform["properties"] as Record<string, unknown>)[
          "rotate"
        ] as Record<string, unknown>;

        expect(transform["x-wpthemejsoneditor-undocumented"]).toBe(true);
        expect(
          transform["x-wpthemejsoneditor-block-style-variation-only"],
        ).toBeUndefined();
        expect(rotate["type"]).toBe("string");
      }
    });

    it("keeps a per-block definition the schema already has", () => {
      const schema = stylesSchema();
      const blockSchema = getNode(schema, ["styles", "blocks"])[
        "x-wpthemejsoneditor-block-schema"
      ] as Record<string, unknown>;
      (blockSchema["properties"] as Record<string, unknown>)["transform"] = {
        type: "object",
        description: "Documented transform styles.",
        properties: { rotate: { type: "string" } },
      };

      const merged = merger.merge(schema, blockOnlySnapshot);
      const transform = blockSchemaProps(merged, "blocks")[
        "transform"
      ] as Record<string, unknown>;

      expect(transform["description"]).toBe("Documented transform styles.");
      expect(transform["x-wpthemejsoneditor-undocumented"]).toBeUndefined();
    });

    it("flags a documented root property too", () => {
      const schema = stylesSchema();
      (getNode(schema, ["styles"])["properties"] as Record<string, unknown>)[
        "transform"
      ] = {
        type: "object",
        properties: { rotate: { type: "string" } },
      };

      const merged = merger.merge(schema, blockOnlySnapshot);
      const transform = getNode(merged, ["styles", "transform"]);

      expect(transform["x-wpthemejsoneditor-undocumented"]).toBeUndefined();
      expect(transform["x-wpthemejsoneditor-block-style-variation-only"]).toBe(
        true,
      );
      expect(blockSchemaProps(merged, "blocks")["transform"]).toBeDefined();
    });
  });

  it("does not mutate the input schema", () => {
    const schema = { properties: { a: { type: "string" } } };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: ["b"],
      properties: [],
    };

    const original = JSON.stringify(schema);
    merger.merge(schema, snapshot);
    expect(JSON.stringify(schema)).toBe(original);
  });
});
