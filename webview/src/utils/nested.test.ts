import { describe, it, expect } from "vitest";
import { getNestedValue, setNestedValue } from "./nested";

describe("getNestedValue", () => {
  it("gets a top-level value", () => {
    expect(getNestedValue({ a: 1 }, ["a"])).toBe(1);
  });

  it("gets a deeply nested value", () => {
    const obj = { a: { b: { c: "deep" } } };
    expect(getNestedValue(obj, ["a", "b", "c"])).toBe("deep");
  });

  it("returns undefined for missing path", () => {
    expect(getNestedValue({ a: 1 }, ["b"])).toBeUndefined();
  });

  it("returns undefined when traversing a non-object", () => {
    expect(getNestedValue({ a: "string" }, ["a", "b"])).toBeUndefined();
  });

  it("returns the root object for empty path", () => {
    const obj = { a: 1 };
    expect(getNestedValue(obj, [])).toEqual({ a: 1 });
  });
});

describe("setNestedValue", () => {
  it("sets a top-level value", () => {
    expect(setNestedValue({ a: 1 }, ["a"], 2)).toEqual({ a: 2 });
  });

  it("sets a deeply nested value", () => {
    const obj = { a: { b: { c: 1 } } };
    const result = setNestedValue(obj, ["a", "b", "c"], 2);
    expect(result).toEqual({ a: { b: { c: 2 } } });
  });

  it("creates intermediate objects when missing", () => {
    const result = setNestedValue({}, ["a", "b", "c"], "new");
    expect(result).toEqual({ a: { b: { c: "new" } } });
  });

  it("does not mutate the original object", () => {
    const obj = { a: { b: 1 } };
    const result = setNestedValue(obj, ["a", "b"], 2);
    expect(obj.a.b).toBe(1);
    expect((result["a"] as Record<string, unknown>)["b"]).toBe(2);
  });

  it("returns the same object for empty path", () => {
    const obj = { a: 1 };
    expect(setNestedValue(obj, [], "ignored")).toEqual({ a: 1 });
  });
});
