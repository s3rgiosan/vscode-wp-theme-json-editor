import { describe, it, expect } from "vitest";
import {
  getThemeRootPath,
  summarizeVariation,
  summarizeVariations,
} from "../variationSummary.js";

describe("getThemeRootPath", () => {
  it("returns the directory holding a theme.json", () => {
    expect(getThemeRootPath("wp-content/themes/acme/theme.json")).toBe(
      "wp-content/themes/acme",
    );
  });

  it("returns the theme root for a variation under styles/", () => {
    expect(
      getThemeRootPath("wp-content/themes/acme/styles/primary.json"),
    ).toBe("wp-content/themes/acme");
  });

  it("returns the theme root for a nested variation", () => {
    expect(
      getThemeRootPath("wp-content/themes/acme/styles/section/blue.json"),
    ).toBe("wp-content/themes/acme");
  });

  it("normalizes Windows separators", () => {
    expect(getThemeRootPath("themes\\acme\\styles\\primary.json")).toBe(
      "themes/acme",
    );
  });

  it("returns an empty root for a file at the top level", () => {
    expect(getThemeRootPath("theme.json")).toBe("");
  });
});

describe("summarizeVariation", () => {
  it("reads the declared title, slug and block types", () => {
    const summary = summarizeVariation(
      "styles/primary.json",
      JSON.stringify({
        title: "Primary",
        slug: "primary",
        blockTypes: ["core/group", "core/column"],
      }),
    );
    expect(summary).toEqual({
      path: "styles/primary.json",
      title: "Primary",
      slug: "primary",
      blockTypes: ["core/group", "core/column"],
    });
  });

  it("falls back to the file name for a missing title", () => {
    expect(summarizeVariation("styles/dark.json", "{}")?.title).toBe("dark");
  });

  it("derives a missing slug from the title", () => {
    expect(
      summarizeVariation("styles/dark.json", '{"title":"Deep Ocean"}')?.slug,
    ).toBe("deep-ocean");
  });

  it("reports no block types for a global variation", () => {
    expect(summarizeVariation("styles/dark.json", "{}")?.blockTypes).toEqual([]);
  });

  it("keeps only string entries in blockTypes", () => {
    expect(
      summarizeVariation(
        "styles/primary.json",
        '{"blockTypes":["core/group",3,null]}',
      )?.blockTypes,
    ).toEqual(["core/group"]);
  });

  it("skips a file that is not valid JSON", () => {
    expect(summarizeVariation("styles/broken.json", "{ nope")).toBeUndefined();
  });

  it("skips a file whose root is not an object", () => {
    expect(summarizeVariation("styles/list.json", "[1, 2]")).toBeUndefined();
  });
});

describe("summarizeVariations", () => {
  const files = [
    { path: "styles/pastel.json", content: '{"title":"Pastel"}' },
    { path: "styles/broken.json", content: "{ nope" },
    {
      path: "styles/primary.json",
      content: '{"title":"Primary","blockTypes":["core/group"]}',
    },
  ];

  it("drops files that cannot be parsed", () => {
    expect(summarizeVariations(files).map((v) => v.path)).not.toContain(
      "styles/broken.json",
    );
  });

  it("sorts by title", () => {
    expect(summarizeVariations(files).map((v) => v.title)).toEqual([
      "Pastel",
      "Primary",
    ]);
  });

  it("returns an empty list for no files", () => {
    expect(summarizeVariations([])).toEqual([]);
  });
});
