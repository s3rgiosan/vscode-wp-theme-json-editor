import { describe, it, expect } from "vitest";
import { getVariationHints } from "./variationHints";

/** Hint messages for the given file, keyed by hint id. */
function hintsById(filePath: string, themeJson: Record<string, unknown>) {
  return Object.fromEntries(
    getVariationHints(filePath, themeJson).map((hint) => [hint.id, hint]),
  );
}

describe("getVariationHints — mode", () => {
  it("reports a block style variation when blockTypes are listed", () => {
    const { mode } = hintsById("styles/primary.json", {
      blockTypes: ["core/group", "core/column"],
      styles: { color: { text: "pink" } },
    });
    expect(mode.severity).toBe("info");
    expect(mode.message).toMatch(/block style variation/i);
    expect(mode.message).toMatch(/2 blocks/);
  });

  it("counts a single block in the singular", () => {
    const { mode } = hintsById("styles/primary.json", {
      blockTypes: ["core/group"],
      styles: { color: { text: "pink" } },
    });
    expect(mode.message).toMatch(/1 block\b/);
  });

  it("reports a global style variation without blockTypes", () => {
    const { mode } = hintsById("styles/dark.json", {
      styles: { color: { text: "white" } },
    });
    expect(mode.severity).toBe("info");
    expect(mode.message).toMatch(/whole site/i);
  });

  it("treats an empty blockTypes list as a global style variation", () => {
    const { mode } = hintsById("styles/dark.json", {
      blockTypes: [],
      styles: { color: { text: "white" } },
    });
    expect(mode.message).toMatch(/whole site/i);
  });
});

describe("getVariationHints — slug", () => {
  it("warns when the slug does not match the file name", () => {
    const { slug } = hintsById("styles/brand.json", {
      slug: "primary",
      styles: {},
    });
    expect(slug.severity).toBe("warning");
    expect(slug.message).toContain("primary");
    expect(slug.message).toContain("brand.json");
  });

  it("stays quiet when the slug matches the file name", () => {
    expect(hintsById("styles/primary.json", { slug: "primary" })).not.toHaveProperty(
      "slug",
    );
  });

  it("stays quiet when no slug is declared", () => {
    expect(hintsById("styles/primary.json", {})).not.toHaveProperty("slug");
  });

  it("ignores case and surrounding whitespace", () => {
    expect(
      hintsById("styles/Primary.json", { slug: " primary " }),
    ).not.toHaveProperty("slug");
  });

  it("compares against the file name of a nested variation", () => {
    expect(
      hintsById("styles/section/blue.json", { slug: "blue" }),
    ).not.toHaveProperty("slug");
  });
});

describe("getVariationHints — empty styles", () => {
  it("warns when a block style variation defines no styles", () => {
    const { styles } = hintsById("styles/primary.json", {
      blockTypes: ["core/group"],
    });
    expect(styles.severity).toBe("warning");
    expect(styles.message).toMatch(/no styles/i);
  });

  it("warns when the styles object is empty", () => {
    expect(
      hintsById("styles/primary.json", {
        blockTypes: ["core/group"],
        styles: {},
      }),
    ).toHaveProperty("styles");
  });

  it("stays quiet once styles are defined", () => {
    expect(
      hintsById("styles/primary.json", {
        blockTypes: ["core/group"],
        styles: { color: { text: "pink" } },
      }),
    ).not.toHaveProperty("styles");
  });

  it("does not warn about empty styles for a global variation", () => {
    expect(hintsById("styles/dark.json", {})).not.toHaveProperty("styles");
  });
});
