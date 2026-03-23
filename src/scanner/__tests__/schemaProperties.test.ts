import { describe, it, expect } from "vitest";
import { extractSchemaPropertyPaths } from "../schemaProperties.js";

describe("extractSchemaPropertyPaths", () => {
  it("extracts leaf and intermediate paths", () => {
    const schema = {
      properties: {
        settings: {
          type: "object",
          properties: {
            color: {
              type: "object",
              properties: {
                palette: { type: "boolean" },
                custom: { type: "boolean" },
              },
            },
          },
        },
      },
    };

    const paths = extractSchemaPropertyPaths(schema);

    expect(paths.has("settings")).toBe(true);
    expect(paths.has("settings.color")).toBe(true);
    expect(paths.has("settings.color.palette")).toBe(true);
    expect(paths.has("settings.color.custom")).toBe(true);
  });

  it("extracts paths from array item schemas", () => {
    const schema = {
      properties: {
        settings: {
          type: "object",
          properties: {
            color: {
              type: "object",
              properties: {
                palette: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      slug: { type: "string" },
                      color: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const paths = extractSchemaPropertyPaths(schema);

    expect(paths.has("settings.color.palette")).toBe(true);
    expect(paths.has("settings.color.palette.name")).toBe(true);
    expect(paths.has("settings.color.palette.slug")).toBe(true);
    expect(paths.has("settings.color.palette.color")).toBe(true);
  });

  it("handles oneOf variants", () => {
    const schema = {
      properties: {
        settings: {
          type: "object",
          properties: {
            typography: {
              type: "object",
              properties: {
                fluid: {
                  oneOf: [
                    { type: "boolean" },
                    {
                      type: "object",
                      properties: {
                        minFontSize: { type: "string" },
                        maxViewportWidth: { type: "string" },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    const paths = extractSchemaPropertyPaths(schema);

    expect(paths.has("settings.typography.fluid")).toBe(true);
    expect(paths.has("settings.typography.fluid.minFontSize")).toBe(true);
    expect(paths.has("settings.typography.fluid.maxViewportWidth")).toBe(true);
  });

  it("returns empty set for schema without properties", () => {
    const paths = extractSchemaPropertyPaths({ type: "object" });
    expect(paths.size).toBe(0);
  });
});
