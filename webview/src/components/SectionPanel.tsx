import { useCallback } from "react";
import { useEditorStore } from "../store/editorStore";
import { formatLabel } from "../utils/formatLabel";
import { getNestedValue } from "../utils/nested";
import { Breadcrumbs } from "./Breadcrumbs";
import { ValidationErrors } from "./ValidationErrors";
import { SectionOverview } from "./SectionOverview";
import { CollapsibleChildren } from "./CollapsibleChildren";
import { BlockMapField } from "./fields/BlockMapField";
import { ArrayField } from "./fields/ArrayField";
import { renderField, resolveSchemaNode, type SchemaNode } from "./fieldRenderer";

interface SectionPanelProps {
  /** Active section key like "settings" or "settings.color" */
  readonly section?: string;
  /** Schema node for this section/subsection */
  readonly schemaNode?: SchemaNode;
  /** Path to this section in the themeJson object */
  readonly path?: string[];
  /** Nesting depth for visual hierarchy */
  readonly depth?: number;
}

const OVERVIEW_SECTIONS = new Set(["settings", "styles"]);

export function SectionPanel({
  section,
  schemaNode,
  path,
  depth = 0,
}: SectionPanelProps) {
  const schema = useEditorStore((s) => s.schema);
  const themeJson = useEditorStore((s) => s.themeJson);
  const showExperimental = useEditorStore((s) => s.showExperimental);
  const setField = useEditorStore((s) => s.setField);

  const sectionParts = section ? section.split(".") : [];
  const resolvedPath = path ?? sectionParts;
  const resolvedSchema =
    schemaNode ?? resolveSchemaNode(schema as SchemaNode, resolvedPath);

  // Stable callbacks passed to renderField to avoid circular imports.
  // useCallback ensures memo'd children don't re-render when SectionPanel does.
  const renderSection = useCallback(
    (p: { schemaNode: SchemaNode; path: string[]; depth: number }) =>
      <SectionPanel schemaNode={p.schemaNode} path={p.path} depth={p.depth} />,
    [],
  );
  const renderCollapsible = useCallback(
    (p: { schemaNode: SchemaNode; path: string[] }) =>
      <CollapsibleChildren schemaNode={p.schemaNode} path={p.path} />,
    [],
  );

  if (!resolvedSchema || typeof resolvedSchema !== "object") {
    return (
      <div className="text-vscode-description-fg text-xs p-4">
        No schema available for this section.
      </div>
    );
  }

  // For top-level "settings" or "styles", show overview cards
  if (
    depth === 0 &&
    section &&
    OVERVIEW_SECTIONS.has(section) &&
    resolvedSchema.properties
  ) {
    return (
      <SectionOverview
        sectionKey={section}
        schema={resolvedSchema}
        showExperimental={showExperimental}
      />
    );
  }

  // Empty state — section exists in schema but not in themeJson data
  if (depth === 0 && resolvedPath.length > 0 && resolvedSchema.properties) {
    const currentValue = getNestedValue(themeJson, resolvedPath);
    if (currentValue === undefined || currentValue === null) {
      return (
        <div>
          <Breadcrumbs path={resolvedPath.join(".")} />
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-vscode-description-fg mb-3">
              This section is not configured in your theme.json yet.
            </p>
            <button
              onClick={() => setField(resolvedPath, {})}
              className="px-3 py-1.5 text-xs rounded bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover"
            >
              Add {formatLabel(resolvedPath[resolvedPath.length - 1] ?? "")} section
            </button>
          </div>
        </div>
      );
    }
  }

  // Handle array-type sections (customTemplates, templateParts, patterns)
  if (resolvedSchema.type === "array") {
    const value = getNestedValue(themeJson, resolvedPath);
    return (
      <div>
        {depth === 0 && <Breadcrumbs path={resolvedPath.join(".")} />}
        <ArrayField
          label={<span>{formatLabel(resolvedPath[resolvedPath.length - 1] ?? "")}</span>}
          description={
            typeof resolvedSchema.description === "string"
              ? resolvedSchema.description
              : undefined
          }
          path={resolvedPath}
          schema={resolvedSchema as Record<string, unknown>}
          value={Array.isArray(value) ? value : []}
        />
      </div>
    );
  }

  // Block map stubs
  if (resolvedSchema["x-wpthemejsoneditor-block-map"] === true) {
    const blockNames = Array.isArray(resolvedSchema["x-wpthemejsoneditor-block-names"])
      ? (resolvedSchema["x-wpthemejsoneditor-block-names"] as string[])
      : [];
    const blockSchemaFromStub = resolvedSchema["x-wpthemejsoneditor-block-schema"] as
      | Record<string, unknown>
      | undefined;
    const isFreeForm = resolvedSchema["x-wpthemejsoneditor-free-form"] === true;
    return (
      <div>
        {depth === 0 && <Breadcrumbs path={resolvedPath.join(".")} />}
        <BlockMapField
          path={resolvedPath}
          blockNames={blockNames}
          blockSchema={blockSchemaFromStub}
          description={typeof resolvedSchema.description === "string" ? resolvedSchema.description : undefined}
          freeForm={isFreeForm}
        />
      </div>
    );
  }

  // Leaf nodes rendered directly when navigated to as a sub-section
  if (depth === 0 && !resolvedSchema.properties && resolvedPath.length > 1) {
    const key = resolvedPath[resolvedPath.length - 1] ?? "";
    return (
      <div>
        <Breadcrumbs path={resolvedPath.join(".")} />
        <div className="mb-3">
          {renderField({
            key,
            node: resolvedSchema,
            fieldPath: resolvedPath,
            isExperimental: resolvedSchema["x-wpthemejsoneditor-experimental"] === true,
            isUndocumented: resolvedSchema["x-wpthemejsoneditor-undocumented"] === true,
            depth: 0,
            renderSection,
            renderCollapsible,
          })}
        </div>
      </div>
    );
  }

  const properties = resolvedSchema.properties;
  if (!properties) {
    return (
      <div className="text-vscode-description-fg text-xs p-4">
        No editable properties in this section.
      </div>
    );
  }

  const entries = Object.entries(properties);

  // When all children are complex objects, render as collapsible accordions
  const allChildrenComplex = entries.length > 3 && entries.every(([, child]) => {
    const c = child as SchemaNode;
    return c.type === "object" && c.properties;
  });

  if (allChildrenComplex) {
    return (
      <div>
        {depth === 0 && <Breadcrumbs path={section ?? resolvedPath.join(".")} />}
        <CollapsibleChildren schemaNode={resolvedSchema} path={resolvedPath} />
      </div>
    );
  }

  return (
    <div
      className={
        depth > 0
          ? "ml-4 mt-2 border-l border-vscode-panel-border pl-4"
          : ""
      }
    >
      {depth === 0 && <Breadcrumbs path={section ?? resolvedPath.join(".")} />}
      {entries.map(([key, propSchema]) => {
        const node = propSchema as SchemaNode;
        const isExperimental =
          node["x-wpthemejsoneditor-experimental"] === true;
        const isUndocumented =
          node["x-wpthemejsoneditor-undocumented"] === true;

        if ((isExperimental || isUndocumented) && !showExperimental) {
          return null;
        }

        const fieldPath = [...resolvedPath, key];

        return (
          <div key={key} className="mb-3">
            {renderField({
              key,
              node,
              fieldPath,
              isExperimental,
              isUndocumented,
              depth,
              renderSection,
              renderCollapsible,
            })}
            <ValidationErrors path={fieldPath} />
          </div>
        );
      })}
    </div>
  );
}
