import { describe, it, expect } from "vitest";
import { validateThemeJson } from "./validate";

describe("validateThemeJson", () => {
  it("returns no errors for valid data", () => {
    const schema = {
      type: "object",
      properties: {
        version: { type: "integer" },
      },
    };
    const data = { version: 3 };
    expect(validateThemeJson(data, schema)).toEqual([]);
  });

  it("returns type errors", () => {
    const schema = {
      type: "object",
      properties: {
        version: { type: "integer" },
      },
    };
    const data = { version: "not a number" };
    const errors = validateThemeJson(data, schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].path).toBe("version");
  });

  it("returns required field errors", () => {
    const schema = {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
      },
    };
    const data = {};
    const errors = validateThemeJson(data, schema);
    expect(errors.some((e) => e.message.includes("name"))).toBe(true);
  });

  it("returns empty array for empty schema", () => {
    expect(validateThemeJson({ anything: true }, {})).toEqual([]);
  });

  it("handles nested property errors", () => {
    const schema = {
      type: "object",
      properties: {
        settings: {
          type: "object",
          properties: {
            color: {
              type: "object",
              properties: {
                custom: { type: "boolean" },
              },
            },
          },
        },
      },
    };
    const data = { settings: { color: { custom: "yes" } } };
    const errors = validateThemeJson(data, schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].path).toBe("settings.color.custom");
  });
});
