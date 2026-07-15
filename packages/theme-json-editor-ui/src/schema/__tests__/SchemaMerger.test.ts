import { describe, it, expect } from "vitest";
import { SchemaMerger } from "../SchemaMerger";

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

  it("types an undocumented path with descendants as an object", () => {
    const schema = { properties: {} };
    const snapshot = {
      generatedAt: "",
      wpVersion: "6.7",
      experimental: [],
      undocumented: [
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
      undocumented: ["settings.mobile", "settings.tablet"],
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
      undocumented: ["settings.viewport.mobile", "settings.viewport"],
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
