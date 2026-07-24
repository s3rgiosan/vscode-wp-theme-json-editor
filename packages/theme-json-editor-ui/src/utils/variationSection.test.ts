import { describe, it, expect } from "vitest";
import {
  VARIATION_KEYS,
  hasVariationSection,
  buildVariationSchemaNode,
} from "./variationSection";

describe("hasVariationSection", () => {
  it("is true for a file directly inside a styles directory", () => {
    expect(hasVariationSection("styles/primary.json", {})).toBe(true);
  });

  it("is true for a file nested deeper under styles", () => {
    expect(
      hasVariationSection(
        "wp-content/themes/acme/styles/section/blue.json",
        {},
      ),
    ).toBe(true);
  });

  it("is true for a Windows-separated styles path", () => {
    expect(hasVariationSection("themes\\acme\\styles\\primary.json", {})).toBe(
      true,
    );
  });

  it("is false for a root theme.json with no variation keys", () => {
    expect(
      hasVariationSection("wp-content/themes/acme/theme.json", {
        version: 3,
        settings: {},
      }),
    ).toBe(false);
  });

  it("is false for a file merely named styles.json", () => {
    expect(hasVariationSection("styles.json", {})).toBe(false);
  });

  it("is true outside styles when the document declares blockTypes", () => {
    expect(
      hasVariationSection("src/theme-json/primary.json", {
        blockTypes: ["core/group"],
      }),
    ).toBe(true);
  });

  it("is true outside styles when the document declares a title", () => {
    expect(
      hasVariationSection("src/theme-json/primary.json", { title: "Primary" }),
    ).toBe(true);
  });

  it("ignores variation keys nested below the root", () => {
    expect(
      hasVariationSection("src/theme-json/primary.json", {
        styles: { title: "not a root key" },
      }),
    ).toBe(false);
  });

  it("is false when a variation key is present but undefined", () => {
    expect(
      hasVariationSection("src/theme-json/primary.json", { slug: undefined }),
    ).toBe(false);
  });

  it("is false for an empty file path and empty document", () => {
    expect(hasVariationSection("", {})).toBe(false);
  });
});

describe("buildVariationSchemaNode", () => {
  const schema = {
    type: "object",
    properties: {
      version: { type: "number" },
      blockTypes: { type: "array", items: { type: "string" } },
      settings: { type: "object", properties: {} },
      title: { type: "string" },
      slug: { type: "string" },
      description: { type: "string" },
    },
  };

  it("returns only the variation keys, in canonical order", () => {
    const node = buildVariationSchemaNode(schema);
    expect(Object.keys(node.properties ?? {})).toEqual([...VARIATION_KEYS]);
  });

  it("carries through each key's schema node", () => {
    const node = buildVariationSchemaNode(schema);
    expect(node.properties?.["blockTypes"]).toBe(
      schema.properties.blockTypes,
    );
  });

  it("is an object node so the section renders as a form", () => {
    expect(buildVariationSchemaNode(schema).type).toBe("object");
  });

  it("omits keys the schema does not define", () => {
    const node = buildVariationSchemaNode({
      type: "object",
      properties: { title: { type: "string" } },
    });
    expect(Object.keys(node.properties ?? {})).toEqual(["title"]);
  });

  it("returns an empty property set for a schema without properties", () => {
    expect(buildVariationSchemaNode({ type: "object" }).properties).toEqual({});
  });

  it("does not mutate the input schema", () => {
    const input = { type: "object", properties: { title: { type: "string" } } };
    const snapshot = JSON.stringify(input);
    buildVariationSchemaNode(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
