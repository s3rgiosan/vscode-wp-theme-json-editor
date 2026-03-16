import { describe, it, expect } from "vitest";
import { minifyCss, prettifyCss } from "./css";

describe("minifyCss", () => {
  it("removes all unnecessary spaces and newlines", () => {
    const input = `.section {
  margin: 1px;
  padding: 2px;
}`;
    expect(minifyCss(input)).toBe(".section{margin:1px;padding:2px;}");
  });

  it("removes comments", () => {
    const input = "/* comment */ .a { color: red; }";
    expect(minifyCss(input)).toBe(".a{color:red;}");
  });

  it("handles empty input", () => {
    expect(minifyCss("")).toBe("");
    expect(minifyCss("   ")).toBe("");
  });

  it("handles multiple rules", () => {
    const input = `
      .a { color: red; }
      .b { color: blue; }
    `;
    expect(minifyCss(input)).toBe(".a{color:red;}.b{color:blue;}");
  });

  it("removes spaces around commas in selectors", () => {
    const input = ".a , .b { color: red; }";
    expect(minifyCss(input)).toBe(".a,.b{color:red;}");
  });

  it("preserves trailing semicolons", () => {
    const input = ".a { color: red; }";
    expect(minifyCss(input)).toBe(".a{color:red;}");
  });
});

describe("prettifyCss", () => {
  it("formats a minified rule", () => {
    const input = ".section{margin:1px;padding:2px;}";
    const result = prettifyCss(input);
    expect(result).toContain("  margin: 1px;");
    expect(result).toContain("  padding: 2px;");
    expect(result).toContain(".section {");
    expect(result).toContain("}");
  });

  it("handles empty input", () => {
    expect(prettifyCss("")).toBe("");
    expect(prettifyCss("  ")).toBe("");
  });

  it("roundtrips with minifyCss", () => {
    const original = ".a{color:red;font-size:14px;}.b{margin:0;}";
    const pretty = prettifyCss(original);
    const minified = minifyCss(pretty);
    expect(minified).toBe(original);
  });
});
