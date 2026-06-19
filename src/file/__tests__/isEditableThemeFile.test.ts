import { describe, it, expect } from "vitest";
import { isEditableThemeFile } from "../isEditableThemeFile.js";

describe("isEditableThemeFile", () => {
  it("matches theme.json at the theme root", () => {
    expect(isEditableThemeFile("/themes/my-theme/theme.json")).toBe(true);
  });

  it("matches a style variation directly under styles/", () => {
    expect(isEditableThemeFile("/themes/my-theme/styles/dark.json")).toBe(true);
  });

  it("matches a style variation nested under styles/ (core recurses)", () => {
    expect(
      isEditableThemeFile("/themes/my-theme/styles/section/blue.json"),
    ).toBe(true);
  });

  it("matches theme.json regardless of directory", () => {
    expect(isEditableThemeFile("theme.json")).toBe(true);
    expect(isEditableThemeFile("/a/b/c/theme.json")).toBe(true);
  });

  it("matches Windows-style paths", () => {
    expect(
      isEditableThemeFile("C:\\themes\\my-theme\\styles\\dark.json"),
    ).toBe(true);
    expect(
      isEditableThemeFile("C:\\themes\\my-theme\\theme.json"),
    ).toBe(true);
  });

  it("rejects a non-theme JSON file outside styles/", () => {
    expect(isEditableThemeFile("/themes/my-theme/package.json")).toBe(false);
    expect(isEditableThemeFile("/project/src/foo.json")).toBe(false);
  });

  it("rejects a JSON file whose name merely contains 'styles'", () => {
    expect(isEditableThemeFile("/themes/my-theme/mystyles.json")).toBe(false);
  });

  it("rejects non-JSON files under styles/", () => {
    expect(isEditableThemeFile("/themes/my-theme/styles/dark.css")).toBe(false);
  });

  it("rejects a file named theme.json.bak", () => {
    expect(isEditableThemeFile("/themes/my-theme/theme.json.bak")).toBe(false);
  });

  describe("custom include patterns", () => {
    const patterns = ["**/theme.json", "**/src/theme-json/**/*.json"];

    it("matches a partial JSON under a configured src directory", () => {
      expect(
        isEditableThemeFile("/themes/my-theme/src/theme-json/colors.json", patterns),
      ).toBe(true);
      expect(
        isEditableThemeFile(
          "/themes/my-theme/src/theme-json/settings/typography.json",
          patterns,
        ),
      ).toBe(true);
    });

    it("still matches theme.json with custom patterns", () => {
      expect(isEditableThemeFile("/themes/my-theme/theme.json", patterns)).toBe(true);
    });

    it("rejects styles/ when the custom patterns omit it", () => {
      expect(
        isEditableThemeFile("/themes/my-theme/styles/dark.json", patterns),
      ).toBe(false);
    });

    it("matches Windows paths against custom patterns", () => {
      expect(
        isEditableThemeFile(
          "C:\\themes\\my-theme\\src\\theme-json\\colors.json",
          patterns,
        ),
      ).toBe(true);
    });
  });
});
