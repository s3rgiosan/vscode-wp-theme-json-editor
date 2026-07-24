import { describe, it, expect } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import {
  inferType,
  getBooleanObjectSchema,
  renderField,
  type SchemaNode,
} from "./fieldRenderer";
import { BlockTypesField } from "./fields/BlockTypesField";
import { ConnectedArrayField } from "./ConnectedFields";

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

describe("renderField — blockTypes", () => {
  const arrayNode: SchemaNode = { type: "array", items: { type: "string" } };

  function render(node: SchemaNode) {
    return renderField({
      key: "blockTypes",
      node,
      fieldPath: ["blockTypes"],
      isExperimental: false,
      isUndocumented: false,
      depth: 0,
      renderSection: () => null,
      renderCollapsible: () => null,
    });
  }

  /** Depth-first search for an element rendered by the given component. */
  function findComponent(tree: ReactNode, component: unknown): ReactElement | undefined {
    if (Array.isArray(tree)) {
      for (const child of tree) {
        const found = findComponent(child, component);
        if (found) {
          return found;
        }
      }
      return undefined;
    }
    if (!isValidElement(tree)) {
      return undefined;
    }
    if (tree.type === component) {
      return tree;
    }
    const { children } = tree.props as { children?: ReactNode };
    return children ? findComponent(children, component) : undefined;
  }

  it("routes a marked node to the block types picker", () => {
    const element = render({
      ...arrayNode,
      "x-wpthemejsoneditor-block-types": true,
      "x-wpthemejsoneditor-block-names": ["core/group"],
    });
    expect(findComponent(element, BlockTypesField)).toBeDefined();
  });

  it("passes the block names through to the picker", () => {
    const element = render({
      ...arrayNode,
      "x-wpthemejsoneditor-block-types": true,
      "x-wpthemejsoneditor-block-names": ["core/group", "core/column"],
    });
    const picker = findComponent(element, BlockTypesField);
    expect(picker?.props).toMatchObject({
      path: ["blockTypes"],
      blockNames: ["core/group", "core/column"],
    });
  });

  it("falls back to an empty block list when the marker carries none", () => {
    const element = render({
      ...arrayNode,
      "x-wpthemejsoneditor-block-types": true,
    });
    expect(findComponent(element, BlockTypesField)?.props).toMatchObject({
      blockNames: [],
    });
  });

  it("still routes an unmarked string array to the array field", () => {
    const element = render(arrayNode);
    expect(findComponent(element, ConnectedArrayField)).toBeDefined();
    expect(findComponent(element, BlockTypesField)).toBeUndefined();
  });
});
