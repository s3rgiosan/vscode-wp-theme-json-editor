import { describe, it, expect } from "vitest";
import {
  buildVariationDocument,
  parseBlockTypesInput,
  toVariationSlug,
} from "../variationScaffold.js";

describe("toVariationSlug", () => {
  it("kebab-cases a title", () => {
    expect(toVariationSlug("Blue Section")).toBe("blue-section");
  });

  it("splits camel case", () => {
    expect(toVariationSlug("BlueSection")).toBe("blue-section");
  });

  it("collapses repeated separators", () => {
    expect(toVariationSlug("Blue   __ Section")).toBe("blue-section");
  });

  it("drops characters that are not slug-safe", () => {
    expect(toVariationSlug("Blue (Section!)")).toBe("blue-section");
  });

  it("trims leading and trailing separators", () => {
    expect(toVariationSlug(" -Blue- ")).toBe("blue");
  });
});

describe("parseBlockTypesInput", () => {
  it("splits a comma-separated list", () => {
    expect(parseBlockTypesInput("core/group, core/column")).toEqual([
      "core/group",
      "core/column",
    ]);
  });

  it("ignores empty entries and stray whitespace", () => {
    expect(parseBlockTypesInput(" core/group ,, ")).toEqual(["core/group"]);
  });

  it("removes duplicates", () => {
    expect(parseBlockTypesInput("core/group, core/group")).toEqual([
      "core/group",
    ]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseBlockTypesInput("   ")).toEqual([]);
  });
});

describe("buildVariationDocument", () => {
  const base = {
    title: "Primary",
    slug: "primary",
    blockTypes: ["core/group"],
    schemaUri: "https://schemas.wp.org/wp/6.9/theme.json",
    version: 3,
  };

  it("writes the variation keys and an empty styles object", () => {
    expect(buildVariationDocument(base)).toEqual({
      $schema: "https://schemas.wp.org/wp/6.9/theme.json",
      version: 3,
      title: "Primary",
      slug: "primary",
      blockTypes: ["core/group"],
      styles: {},
    });
  });

  it("omits blockTypes for a global variation", () => {
    expect(
      buildVariationDocument({ ...base, blockTypes: [] }),
    ).not.toHaveProperty("blockTypes");
  });

  it("orders the keys as WordPress documents them", () => {
    expect(Object.keys(buildVariationDocument(base))).toEqual([
      "$schema",
      "version",
      "title",
      "slug",
      "blockTypes",
      "styles",
    ]);
  });
});
