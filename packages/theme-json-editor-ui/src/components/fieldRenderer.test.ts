import { describe, it, expect } from "vitest";
import { inferType, getBooleanObjectSchema, type SchemaNode } from "./fieldRenderer";

describe("inferType", () => {
  it("returns node.type when present", () => {
    expect(inferType({ type: "string" })).toBe("string");
  });

  it("returns first non-object type from oneOf", () => {
    expect(
      inferType({
        oneOf: [
          { type: "object", properties: {} },
          { type: "boolean" },
        ],
      }),
    ).toBe("boolean");
  });

  it("returns first non-object type from anyOf", () => {
    expect(
      inferType({
        anyOf: [
          { type: "object", properties: {} },
          { type: "string" },
        ],
      }),
    ).toBe("string");
  });

  it("returns 'object' for additionalProperties without properties", () => {
    expect(inferType({ additionalProperties: true })).toBe("object");
  });

  it("returns undefined when no type can be inferred", () => {
    expect(inferType({})).toBeUndefined();
  });

  it("prefers node.type over oneOf", () => {
    expect(
      inferType({
        type: "number",
        oneOf: [{ type: "boolean" }],
      }),
    ).toBe("number");
  });
});

describe("getBooleanObjectSchema", () => {
  it("returns object branch from oneOf with boolean + object", () => {
    const objectBranch: SchemaNode = {
      type: "object",
      properties: { min: { type: "string" }, max: { type: "string" } },
    };
    const node: SchemaNode = {
      oneOf: [objectBranch, { type: "boolean" }],
    };
    expect(getBooleanObjectSchema(node)).toBe(objectBranch);
  });

  it("returns object branch from anyOf with boolean + object", () => {
    const objectBranch: SchemaNode = {
      type: "object",
      properties: { foo: { type: "string" } },
    };
    const node: SchemaNode = {
      anyOf: [{ type: "boolean" }, objectBranch],
    };
    expect(getBooleanObjectSchema(node)).toBe(objectBranch);
  });

  it("returns undefined when no boolean type", () => {
    const node: SchemaNode = {
      oneOf: [
        { type: "object", properties: { a: { type: "string" } } },
        { type: "string" },
      ],
    };
    expect(getBooleanObjectSchema(node)).toBeUndefined();
  });

  it("returns undefined when object has no properties", () => {
    const node: SchemaNode = {
      oneOf: [{ type: "object" }, { type: "boolean" }],
    };
    expect(getBooleanObjectSchema(node)).toBeUndefined();
  });

  it("returns undefined when no oneOf/anyOf", () => {
    expect(getBooleanObjectSchema({ type: "boolean" })).toBeUndefined();
  });

  it("returns undefined for empty oneOf", () => {
    expect(getBooleanObjectSchema({ oneOf: [] })).toBeUndefined();
  });
});
