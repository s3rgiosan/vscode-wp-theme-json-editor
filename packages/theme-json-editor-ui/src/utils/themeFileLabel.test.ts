import { describe, it, expect } from "vitest";
import { themeFileLabel } from "./themeFileLabel";

describe("themeFileLabel", () => {
  it("returns the basename for theme.json", () => {
    expect(themeFileLabel("theme.json")).toBe("theme.json");
    expect(themeFileLabel("/abs/my-theme/theme.json")).toBe("theme.json");
  });

  it("returns the basename for a style variation", () => {
    expect(themeFileLabel("styles/dark.json")).toBe("dark.json");
    expect(themeFileLabel("/abs/my-theme/styles/section/blue.json")).toBe(
      "blue.json",
    );
  });

  it("handles Windows separators", () => {
    expect(themeFileLabel("C:\\theme\\styles\\dark.json")).toBe("dark.json");
  });

  it("returns null for a synthetic non-file identifier", () => {
    expect(themeFileLabel("wp_global_styles#123")).toBeNull();
    expect(themeFileLabel("wp_global_styles#0")).toBeNull();
  });

  it("returns null for an empty path", () => {
    expect(themeFileLabel("")).toBeNull();
  });
});
