import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../SchemaMerger.js";

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
      undocumented: [],
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
      undocumented: ["myProp"],
    };

    const merged = merger.merge(schema, snapshot);
    const props = (merged["properties"] as Record<string, unknown>);
    const prop = props["myProp"] as Record<string, unknown>;

    expect(prop).toBeDefined();
    expect(prop["x-wpthemejsoneditor-undocumented"]).toBe(true);
  });

  it("does not mutate the input schema", () => {
    const schema = { properties: { a: { type: "string" } } };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: ["b"],
      undocumented: [],
    };

    const original = JSON.stringify(schema);
    merger.merge(schema, snapshot);
    expect(JSON.stringify(schema)).toBe(original);
  });
});
