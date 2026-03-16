import { useState, useMemo, memo } from "react";
import { useEditorStore } from "../store/editorStore";
import { getNestedValue } from "../utils/nested";
import { formatLabel } from "../utils/formatLabel";
import { ExperimentalBadge } from "./ExperimentalBadge";
import { SectionPanel } from "./SectionPanel";
import { ACCORDION_HEADER_CLASS } from "./styles";
import type { SchemaNode } from "./fieldRenderer";

interface CollapsibleChildrenProps {
  readonly schemaNode: SchemaNode;
  readonly path: string[];
}

/**
 * Renders each child property of a complex object as a collapsible accordion card.
 * Used when a section has many child objects (e.g. styles.elements with 11 element types).
 */
export const CollapsibleChildren = memo(function CollapsibleChildren({
  schemaNode,
  path,
}: CollapsibleChildrenProps) {
  const themeJson = useEditorStore((s) => s.themeJson);
  const showExperimental = useEditorStore((s) => s.showExperimental);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const properties = schemaNode.properties;
  if (!properties) {
    return null;
  }

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const visibleEntries = useMemo(() => {
    return Object.entries(properties).filter(([, propSchema]) => {
      const node = propSchema as SchemaNode;
      const isExp = node["x-wpthemejsoneditor-experimental"] === true;
      const isUndoc = node["x-wpthemejsoneditor-undocumented"] === true;
      return !((isExp || isUndoc) && !showExperimental);
    });
  }, [properties, showExperimental]);

  return (
    <div className="space-y-1.5 mt-2">
      {visibleEntries.map(([key, propSchema]) => {
        const node = propSchema as SchemaNode;
        const isExperimental = node["x-wpthemejsoneditor-experimental"] === true;
        const isUndocumented = node["x-wpthemejsoneditor-undocumented"] === true;
        const childPath = [...path, key];
        const hasData = getNestedValue(themeJson, childPath) !== undefined;
        const isExpanded = expanded.has(key);

        return (
          <div key={key} className="border border-vscode-panel-border rounded">
            <div className={ACCORDION_HEADER_CLASS}>
              <button
                onClick={() => toggle(key)}
                className="flex-1 text-left text-xs font-medium flex items-center gap-1 hover:opacity-80"
              >
                {formatLabel(key)}
                {isExperimental && <ExperimentalBadge />}
                {isUndocumented && <ExperimentalBadge isUndocumented />}
                {hasData && (
                  <span className="text-[10px] text-vscode-description-fg font-normal">configured</span>
                )}
              </button>
              <button
                onClick={() => toggle(key)}
                className="text-[10px] hover:opacity-80 shrink-0 ml-1.5"
                aria-expanded={isExpanded}
              >
                {isExpanded ? "\u25BC" : "\u25B6"}
              </button>
            </div>
            {isExpanded && (
              <div className="px-3 py-2">
                <SectionPanel schemaNode={node} path={childPath} depth={2} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
