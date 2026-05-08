import { describe, it, expect } from "vitest";
import { formatLabel } from "./formatLabel";

describe("formatLabel", () => {
  it("returns overrides for known keys", () => {
    expect(formatLabel("css")).toBe("CSS");
    expect(formatLabel("url")).toBe("URL");
    expect(formatLabel("api")).toBe("API");
    expect(formatLabel("fontFamily")).toBe("Font Family");
    expect(formatLabel("postTypes")).toBe("Post Types");
  });

  it("converts camelCase to Title Case", () => {
    expect(formatLabel("backgroundColor")).toBe("Background Color");
    expect(formatLabel("customGradient")).toBe("Custom Gradient");
    expect(formatLabel("blockGap")).toBe("Block Gap");
  });

  it("capitalises single-word keys", () => {
    expect(formatLabel("padding")).toBe("Padding");
    expect(formatLabel("margin")).toBe("Margin");
  });

  it("handles already-capitalized keys", () => {
    expect(formatLabel("Color")).toBe("Color");
  });
});
