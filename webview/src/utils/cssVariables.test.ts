import { describe, it, expect } from "vitest";
import { extractCssVariables, camelToKebab, buildCssVarName, buildPresetCssVarName } from "./cssVariables";

describe("extractCssVariables", () => {
  it("returns empty array for empty themeJson", () => {
    expect(extractCssVariables({})).toEqual([]);
  });

  it("returns empty array when settings is not an object", () => {
    expect(extractCssVariables({ settings: "nope" })).toEqual([]);
  });

  it("extracts color palette presets", () => {
    const vars = extractCssVariables({
      settings: {
        color: {
          palette: [
            { slug: "primary", color: "#ff0000" },
            { slug: "secondary", color: "#00ff00" },
          ],
        },
      },
    });
    expect(vars).toEqual([
      { name: "--wp--preset--color--primary", value: "#ff0000", category: "Color" },
      { name: "--wp--preset--color--secondary", value: "#00ff00", category: "Color" },
    ]);
  });

  it("extracts gradient presets", () => {
    const vars = extractCssVariables({
      settings: {
        color: {
          gradients: [
            { slug: "sunset", gradient: "linear-gradient(#e66465, #9198e5)" },
          ],
        },
      },
    });
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("--wp--preset--gradient--sunset");
    expect(vars[0]?.category).toBe("Gradient");
  });

  it("extracts font family presets", () => {
    const vars = extractCssVariables({
      settings: {
        typography: {
          fontFamilies: [
            { slug: "inter", fontFamily: "Inter, sans-serif" },
          ],
        },
      },
    });
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("--wp--preset--font-family--inter");
  });

  it("extracts font size presets", () => {
    const vars = extractCssVariables({
      settings: {
        typography: {
          fontSizes: [
            { slug: "large", size: "2rem" },
            { slug: "medium", size: 16 },
          ],
        },
      },
    });
    expect(vars).toHaveLength(2);
    expect(vars[0]?.name).toBe("--wp--preset--font-size--large");
    expect(vars[0]?.value).toBe("2rem");
    expect(vars[1]?.value).toBe("16");
  });

  it("extracts spacing size presets", () => {
    const vars = extractCssVariables({
      settings: {
        spacing: {
          spacingSizes: [{ slug: "medium", size: "1.5rem" }],
        },
      },
    });
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("--wp--preset--spacing--medium");
  });

  it("extracts custom variables recursively with camelCase → kebab conversion", () => {
    const vars = extractCssVariables({
      settings: {
        custom: {
          lineHeight: {
            small: 1.3,
            large: 1.8,
          },
          siteContentWidth: "800px",
        },
      },
    });
    expect(vars).toEqual([
      { name: "--wp--custom--line-height--small", value: "1.3", category: "Custom" },
      { name: "--wp--custom--line-height--large", value: "1.8", category: "Custom" },
      { name: "--wp--custom--site-content-width", value: "800px", category: "Custom" },
    ]);
  });

  it("skips entries without slugs", () => {
    const vars = extractCssVariables({
      settings: {
        color: {
          palette: [
            { color: "#ff0000" },
            { slug: "", color: "#00ff00" },
            { slug: "valid", color: "#0000ff" },
          ],
        },
      },
    });
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("--wp--preset--color--valid");
  });

  it("extracts from multiple sources at once", () => {
    const vars = extractCssVariables({
      settings: {
        color: {
          palette: [{ slug: "primary", color: "#ff0000" }],
        },
        typography: {
          fontSizes: [{ slug: "large", size: "2rem" }],
        },
        custom: {
          spacing: "20px",
        },
      },
    });
    expect(vars).toHaveLength(3);
    expect(vars.map((v) => v.category)).toEqual(["Color", "Font Size", "Custom"]);
  });
});

describe("camelToKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(camelToKebab("lineHeight")).toBe("line-height");
    expect(camelToKebab("fontSize")).toBe("font-size");
    expect(camelToKebab("siteContentWidth")).toBe("site-content-width");
  });

  it("handles already lowercase strings", () => {
    expect(camelToKebab("color")).toBe("color");
  });

  it("handles single uppercase letters", () => {
    expect(camelToKebab("A")).toBe("-a");
  });
});

describe("buildCssVarName", () => {
  it("builds CSS variable name from segments", () => {
    expect(buildCssVarName(["lineHeight", "small"])).toBe(
      "--wp--custom--line-height--small",
    );
  });

  it("handles single segment", () => {
    expect(buildCssVarName(["spacing"])).toBe("--wp--custom--spacing");
  });

  it("handles deeply nested segments", () => {
    expect(buildCssVarName(["a", "bC", "dEf"])).toBe(
      "--wp--custom--a--b-c--d-ef",
    );
  });
});

describe("buildPresetCssVarName", () => {
  it("builds color preset variable", () => {
    expect(buildPresetCssVarName(["settings", "color", "palette"], "primary")).toBe(
      "--wp--preset--color--primary",
    );
  });

  it("builds gradient preset variable", () => {
    expect(buildPresetCssVarName(["settings", "color", "gradients"], "sunset")).toBe(
      "--wp--preset--gradient--sunset",
    );
  });

  it("builds duotone preset variable", () => {
    expect(buildPresetCssVarName(["settings", "color", "duotone"], "dark-grayscale")).toBe(
      "--wp--preset--duotone--dark-grayscale",
    );
  });

  it("builds font-family preset variable", () => {
    expect(buildPresetCssVarName(["settings", "typography", "fontFamilies"], "inter")).toBe(
      "--wp--preset--font-family--inter",
    );
  });

  it("builds font-size preset variable", () => {
    expect(buildPresetCssVarName(["settings", "typography", "fontSizes"], "large")).toBe(
      "--wp--preset--font-size--large",
    );
  });

  it("builds spacing preset variable", () => {
    expect(buildPresetCssVarName(["settings", "spacing", "spacingSizes"], "medium")).toBe(
      "--wp--preset--spacing--medium",
    );
  });

  it("builds shadow preset variable (nested path)", () => {
    expect(buildPresetCssVarName(["settings", "shadow", "presets"], "natural")).toBe(
      "--wp--preset--shadow--natural",
    );
  });

  it("builds aspect-ratio preset variable", () => {
    expect(buildPresetCssVarName(["settings", "dimensions", "aspectRatios"], "wide")).toBe(
      "--wp--preset--aspect-ratio--wide",
    );
  });

  it("returns null for unknown array paths", () => {
    expect(buildPresetCssVarName(["settings", "color", "unknown"], "test")).toBeNull();
  });

  it("returns null for empty slug", () => {
    expect(buildPresetCssVarName(["settings", "color", "palette"], "")).toBeNull();
  });
});
