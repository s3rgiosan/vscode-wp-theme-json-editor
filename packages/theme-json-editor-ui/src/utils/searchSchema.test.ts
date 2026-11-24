import { describe, it, expect } from "vitest";
import { searchSchema } from "./searchSchema";

const schema = {
  properties: {
    styles: {
      type: "object",
      properties: {
        color: { type: "object", properties: { text: { type: "string" } } },
        transform: {
          type: "object",
          "x-wpthemejsoneditor-block-style-variation-only": true,
          properties: { rotate: { type: "string" } },
        },
        filter: {
          type: "object",
          "x-wpthemejsoneditor-undocumented": true,
          properties: { duotone: { type: "string" } },
        },
      },
    },
  },
};

const paths = (results: ReturnType<typeof searchSchema>) =>
  results.map((result) => result.path);

describe("searchSchema", () => {
  it("finds every match when no visibility is given", () => {
    expect(paths(searchSchema(schema, "rotate"))).toEqual([
      "styles.transform.rotate",
    ]);
    expect(paths(searchSchema(schema, "duotone"))).toEqual([
      "styles.filter.duotone",
    ]);
  });

  it("skips a block-only property and its children outside a partial", () => {
    const visibility = { showExperimental: true, isBlockStyleVariation: false };

    expect(searchSchema(schema, "transform", 50, visibility)).toEqual([]);
    expect(searchSchema(schema, "rotate", 50, visibility)).toEqual([]);
  });

  it("lists a block-only property in a partial", () => {
    const visibility = { showExperimental: true, isBlockStyleVariation: true };

    expect(paths(searchSchema(schema, "rotate", 50, visibility))).toEqual([
      "styles.transform.rotate",
    ]);
  });

  it("skips undocumented properties while they are hidden", () => {
    const visibility = { showExperimental: false, isBlockStyleVariation: true };

    expect(searchSchema(schema, "duotone", 50, visibility)).toEqual([]);
    expect(paths(searchSchema(schema, "text", 50, visibility))).toEqual([
      "styles.color.text",
    ]);
  });
});
