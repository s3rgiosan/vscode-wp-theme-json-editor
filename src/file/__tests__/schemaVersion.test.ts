import { describe, it, expect } from "vitest";
import { parseSchemaVersion } from "../schemaVersion.js";

describe("parseSchemaVersion", () => {
  it("returns the release from a versioned schema URL", () => {
    expect(
      parseSchemaVersion("https://schemas.wp.org/wp/6.7/theme.json"),
    ).toBe("6.7");
  });

  it("returns trunk from the trunk schema URL", () => {
    expect(
      parseSchemaVersion("https://schemas.wp.org/trunk/theme.json"),
    ).toBe("trunk");
  });

  it("returns undefined for other URLs", () => {
    expect(
      parseSchemaVersion("https://example.com/schemas/theme.json"),
    ).toBeUndefined();
  });
});
