import { describe, it, expect } from "vitest";
import { SchemaResolver } from "../SchemaResolver.js";

describe("SchemaResolver", () => {
  it("resolves a simple $ref", () => {
    const schema = {
      definitions: {
        myDef: { type: "string", description: "A string" },
      },
      properties: {
        name: { $ref: "#/definitions/myDef" },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const props = (resolved as Record<string, unknown>)["properties"] as Record<string, unknown>;
    expect(props["name"]).toEqual({ type: "string", description: "A string" });
  });

  it("resolves allOf by merging properties", () => {
    const schema = {
      definitions: {
        base: { type: "object", properties: { a: { type: "string" } } },
        extra: { type: "object", properties: { b: { type: "number" } } },
      },
      properties: {
        section: {
          allOf: [
            { $ref: "#/definitions/base" },
            { $ref: "#/definitions/extra" },
          ],
        },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const section = ((resolved as Record<string, unknown>)["properties"] as Record<string, unknown>)["section"] as Record<string, unknown>;
    const props = section["properties"] as Record<string, unknown>;
    expect(props["a"]).toEqual({ type: "string" });
    expect(props["b"]).toEqual({ type: "number" });
  });

  it("handles circular references without infinite loop", () => {
    const schema = {
      definitions: {
        self: { $ref: "#/definitions/self" },
      },
      properties: {
        loop: { $ref: "#/definitions/self" },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const props = (resolved as Record<string, unknown>)["properties"] as Record<string, unknown>;
    expect(props["loop"]).toEqual({});
  });

  it("stubs blocks under settings with block names and schema", () => {
    const schema = {
      definitions: {
        settingsBlocksComplete: {
          type: "object",
          properties: {
            "core/paragraph": { $ref: "#/definitions/blockSettings" },
            "core/heading": { $ref: "#/definitions/blockSettings" },
          },
        },
        blockSettings: {
          type: "object",
          properties: { color: { type: "object", properties: { custom: { type: "boolean" } } } },
        },
      },
      properties: {
        settings: {
          type: "object",
          properties: {
            blocks: { $ref: "#/definitions/settingsBlocksComplete" },
          },
        },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const settings = ((resolved as Record<string, unknown>)["properties"] as Record<string, unknown>)["settings"] as Record<string, unknown>;
    const blocks = (settings["properties"] as Record<string, unknown>)["blocks"] as Record<string, unknown>;
    expect(blocks["x-wpthemejsoneditor-block-map"]).toBe(true);
    expect(blocks["x-wpthemejsoneditor-block-names"]).toEqual(["core/paragraph", "core/heading"]);

    const blockSchema = blocks["x-wpthemejsoneditor-block-schema"] as Record<string, unknown>;
    expect(blockSchema).toBeDefined();
    expect((blockSchema["properties"] as Record<string, unknown>)["color"]).toBeDefined();
  });

  it("strips definitions from output", () => {
    const schema = {
      definitions: { foo: { type: "string" } },
      properties: { bar: { $ref: "#/definitions/foo" } },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);
    expect((resolved as Record<string, unknown>)["definitions"]).toBeUndefined();
  });

  it("handles patternProperties for free-form maps", () => {
    const schema = {
      definitions: {
        variationDef: {
          type: "object",
          patternProperties: {
            "^[a-z]+$": { $ref: "#/definitions/variationProps" },
          },
        },
        variationProps: {
          type: "object",
          properties: { color: { type: "string" } },
        },
      },
      properties: {
        styles: {
          type: "object",
          properties: {
            variations: { $ref: "#/definitions/variationDef" },
          },
        },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const styles = ((resolved as Record<string, unknown>)["properties"] as Record<string, unknown>)["styles"] as Record<string, unknown>;
    const variations = (styles["properties"] as Record<string, unknown>)["variations"] as Record<string, unknown>;
    expect(variations["x-wpthemejsoneditor-block-map"]).toBe(true);
    expect(variations["x-wpthemejsoneditor-free-form"]).toBe(true);
  });

  it("resolves oneOf keeping the structure", () => {
    const schema = {
      definitions: {},
      properties: {
        field: {
          oneOf: [
            { type: "string" },
            { type: "number" },
          ],
        },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const props = (resolved as Record<string, unknown>)["properties"] as Record<string, unknown>;
    const field = props["field"] as Record<string, unknown>;
    expect(field["oneOf"]).toEqual([
      { type: "string" },
      { type: "number" },
    ]);
  });

  it("merges $ref sibling properties", () => {
    const schema = {
      definitions: {
        base: { type: "string" },
      },
      properties: {
        field: {
          $ref: "#/definitions/base",
          description: "A custom description",
        },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const props = (resolved as Record<string, unknown>)["properties"] as Record<string, unknown>;
    const field = props["field"] as Record<string, unknown>;
    expect(field["type"]).toBe("string");
    expect(field["description"]).toBe("A custom description");
  });

  it("does not stub blocks at non-settings/styles paths", () => {
    const schema = {
      definitions: {
        blocksDef: {
          type: "object",
          properties: {
            "core/paragraph": { type: "string" },
          },
        },
      },
      properties: {
        other: {
          type: "object",
          properties: {
            blocks: { $ref: "#/definitions/blocksDef" },
          },
        },
      },
    };

    const resolver = new SchemaResolver(schema);
    const resolved = resolver.resolve(schema);

    const other = ((resolved as Record<string, unknown>)["properties"] as Record<string, unknown>)["other"] as Record<string, unknown>;
    const blocks = (other["properties"] as Record<string, unknown>)["blocks"] as Record<string, unknown>;
    // Should NOT be stubbed — not under settings or styles
    expect(blocks["x-wpthemejsoneditor-block-map"]).toBeUndefined();
    expect(blocks["properties"]).toBeDefined();
  });
});
