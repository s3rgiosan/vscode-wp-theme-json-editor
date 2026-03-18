import { type ReactNode } from "react";
import { formatLabel } from "../utils/formatLabel";
import { Description } from "./Description";
import { ExperimentalBadge } from "./ExperimentalBadge";
import { BlockMapField } from "./fields/BlockMapField";
import {
  ConnectedToggleField,
  ConnectedToggleObjectField,
  ConnectedSelectField,
  ConnectedColorField,
  ConnectedCssField,
  ConnectedNumberField,
  ConnectedTextField,
  ConnectedArrayField,
  ConnectedCustomVariablesField,
} from "./ConnectedFields";

export interface SchemaNode {
  readonly type?: string;
  readonly enum?: readonly string[];
  readonly properties?: Record<string, SchemaNode>;
  readonly description?: string;
  readonly "x-wpthemejsoneditor-experimental"?: boolean;
  readonly "x-wpthemejsoneditor-undocumented"?: boolean;
  readonly [key: string]: unknown;
}

export interface RenderFieldParams {
  key: string;
  node: SchemaNode;
  fieldPath: string[];
  isExperimental: boolean;
  isUndocumented: boolean;
  depth: number;
  /** Renderer for nested object sections — passed in to avoid circular imports. */
  renderSection: (props: { schemaNode: SchemaNode; path: string[]; depth: number }) => ReactNode;
  /** Renderer for collapsible child accordions — passed in to avoid circular imports. */
  renderCollapsible: (props: { schemaNode: SchemaNode; path: string[] }) => ReactNode;
}

/**
 * Infer the effective type of a schema node.
 */
export function inferType(node: SchemaNode): string | undefined {
  if (node.type) {
    return node.type;
  }
  for (const combiner of ["oneOf", "anyOf"] as const) {
    const options = node[combiner];
    if (Array.isArray(options)) {
      for (const opt of options) {
        if (typeof opt === "object" && opt !== null) {
          const optType = (opt as SchemaNode).type;
          if (typeof optType === "string" && optType !== "object") {
            return optType;
          }
        }
      }
    }
  }
  if (node["additionalProperties"] && !node.properties) {
    return "object";
  }
  return undefined;
}

/**
 * If the node is a oneOf/anyOf combining boolean + object, return the object
 * schema branch. Otherwise return undefined.
 */
export function getBooleanObjectSchema(node: SchemaNode): SchemaNode | undefined {
  for (const combiner of ["oneOf", "anyOf"] as const) {
    const options = node[combiner];
    if (!Array.isArray(options)) continue;

    let hasBoolean = false;
    let objectBranch: SchemaNode | undefined;

    for (const opt of options) {
      if (typeof opt !== "object" || opt === null) continue;
      const s = opt as SchemaNode;
      if (s.type === "boolean") hasBoolean = true;
      if (s.type === "object" && s.properties) objectBranch = s;
    }

    if (hasBoolean && objectBranch) return objectBranch;
  }
  return undefined;
}

/** Walk the schema tree along the given path to find the schema node. */
export function resolveSchemaNode(
  schema: SchemaNode,
  path: string[],
): SchemaNode | undefined {
  let current: SchemaNode | undefined = schema;
  for (const segment of path) {
    if (!current?.properties) {
      return undefined;
    }
    current = current.properties[segment] as SchemaNode | undefined;
  }
  return current;
}

/**
 * Render the appropriate connected field component for a schema node.
 * Each returned component subscribes to its own store slice internally.
 *
 * Priority: array -> block map -> object -> boolean -> enum -> color -> css -> number -> string.
 */
export function renderField({
  key,
  node,
  fieldPath,
  isExperimental,
  isUndocumented,
  depth,
  renderSection,
  renderCollapsible,
}: RenderFieldParams) {
  const label = (
    <span>
      {formatLabel(key)}
      {isExperimental && <ExperimentalBadge />}
      {isUndocumented && <ExperimentalBadge isUndocumented />}
    </span>
  );

  const description =
    typeof node.description === "string" ? node.description : undefined;
  const effectiveType = inferType(node);

  // Priority 1: array
  if (effectiveType === "array") {
    return (
      <ConnectedArrayField
        fieldPath={fieldPath}
        label={label}
        description={description}
        schema={node as Record<string, unknown>}
      />
    );
  }

  // Block map
  if (node["x-wpthemejsoneditor-block-map"] === true) {
    const blockNames = Array.isArray(node["x-wpthemejsoneditor-block-names"])
      ? (node["x-wpthemejsoneditor-block-names"] as string[])
      : [];
    const blockSchemaFromNode = node["x-wpthemejsoneditor-block-schema"] as
      | Record<string, unknown>
      | undefined;
    const isFreeFormField = node["x-wpthemejsoneditor-free-form"] === true;
    return (
      <fieldset className="mt-2">
        <legend className="text-xs font-medium mb-1">{label}</legend>
        <BlockMapField
          path={fieldPath}
          blockNames={blockNames}
          blockSchema={blockSchemaFromNode}
          description={description}
          freeForm={isFreeFormField}
        />
      </fieldset>
    );
  }

  // Priority 2: nested object with known properties
  if (effectiveType === "object" && node.properties) {
    const childEntries = Object.entries(node.properties);
    const childrenAreComplex = childEntries.length > 3 && childEntries.every(
      ([, child]) => {
        const c = child as SchemaNode;
        return c.type === "object" && c.properties;
      },
    );

    if (childrenAreComplex) {
      return (
        <fieldset className="mt-2">
          <legend className="text-xs font-medium mb-1">{label}</legend>
          {description && <Description text={description} className="mb-2" />}
          {renderCollapsible({ schemaNode: node, path: fieldPath })}
        </fieldset>
      );
    }

    return (
      <fieldset className="mt-2">
        <legend className="text-xs font-medium mb-1">{label}</legend>
        {description && <Description text={description} className="mb-2" />}
        {renderSection({ schemaNode: node, path: fieldPath, depth: depth + 1 })}
      </fieldset>
    );
  }

  // Free-form object
  if (effectiveType === "object" && !node.properties) {
    if (key === "custom" && node["additionalProperties"]) {
      return (
        <fieldset className="mt-2">
          <legend className="text-xs font-medium mb-1">{label}</legend>
          <ConnectedCustomVariablesField fieldPath={fieldPath} description={description} />
        </fieldset>
      );
    }

    return (
      <ConnectedCssField
        fieldPath={fieldPath}
        label={label}
        description={description}
        jsonMode
      />
    );
  }

  // Priority 3a: boolean + object oneOf (e.g. typography.fluid)
  const boolObjectSchema = getBooleanObjectSchema(node);
  if (boolObjectSchema) {
    return (
      <ConnectedToggleObjectField
        fieldPath={fieldPath}
        label={label}
        description={description}
        objectSchema={boolObjectSchema}
      />
    );
  }

  // Priority 3b: boolean
  if (effectiveType === "boolean") {
    return (
      <ConnectedToggleField
        fieldPath={fieldPath}
        label={label}
        description={description}
      />
    );
  }

  // Priority 4: string + enum
  if (effectiveType === "string" && node.enum) {
    return (
      <ConnectedSelectField
        fieldPath={fieldPath}
        label={label}
        description={description}
        options={node.enum as string[]}
      />
    );
  }

  // Priority 5: string + color key
  if (effectiveType === "string" && /color$/i.test(key)) {
    return (
      <ConnectedColorField
        fieldPath={fieldPath}
        label={label}
        description={description}
      />
    );
  }

  // Priority 6: string + css key
  if (effectiveType === "string" && key === "css") {
    return (
      <ConnectedCssField
        fieldPath={fieldPath}
        label={label}
        description={description}
      />
    );
  }

  // Priority 7: number/integer
  if (effectiveType === "number" || effectiveType === "integer") {
    return (
      <ConnectedNumberField
        fieldPath={fieldPath}
        label={label}
        description={description}
        isInteger={effectiveType === "integer"}
      />
    );
  }

  // Priority 8: string (default)
  return (
    <ConnectedTextField
      fieldPath={fieldPath}
      label={label}
      description={description}
    />
  );
}
