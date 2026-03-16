import { memo } from "react";
import { useEditorStore } from "../store/editorStore";
import { formatLabel } from "../utils/formatLabel";
import { Description } from "./Description";
import { ExperimentalBadge } from "./ExperimentalBadge";
import { Breadcrumbs } from "./Breadcrumbs";
import type { SchemaNode } from "./fieldRenderer";

interface SectionOverviewProps {
  readonly sectionKey: string;
  readonly schema: SchemaNode;
  readonly showExperimental: boolean;
}

/**
 * Renders a grid of clickable cards for each sub-section of a large section
 * (Settings, Styles). Clicking a card navigates into that sub-section.
 */
export const SectionOverview = memo(function SectionOverview({
  sectionKey,
  schema,
  showExperimental,
}: SectionOverviewProps) {
  const setActiveSection = useEditorStore((s) => s.setActiveSection);
  const properties = schema.properties;
  if (!properties) {
    return null;
  }

  const entries = Object.entries(properties);

  return (
    <div>
      <Breadcrumbs path={sectionKey} />
      {typeof schema.description === "string" ? (
        <Description text={schema.description} className="mb-4" />
      ) : (
        <p className="text-[11px] text-vscode-description-fg mb-4">
          Select a sub-section to edit.
        </p>
      )}
      <div className="grid gap-2">
        {entries.map(([key, propSchema]) => {
          const node = propSchema as SchemaNode;
          const isExperimental =
            node["x-wpthemejsoneditor-experimental"] === true;
          const isUndocumented =
            node["x-wpthemejsoneditor-undocumented"] === true;

          if ((isExperimental || isUndocumented) && !showExperimental) {
            return null;
          }

          const subKey = `${sectionKey}.${key}`;
          const desc =
            typeof node.description === "string" ? node.description : "";
          const shortDesc =
            desc.length > 120 ? `${desc.slice(0, 117)}...` : desc;

          return (
            <button
              key={key}
              onClick={() => setActiveSection(subKey)}
              className="text-left px-4 py-3 rounded border border-vscode-panel-border hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {formatLabel(key)}
                </span>
                {isExperimental && <ExperimentalBadge />}
                {isUndocumented && <ExperimentalBadge isUndocumented />}
              </div>
              {shortDesc && (
                <p className="text-[11px] text-vscode-description-fg mt-1">
                  {shortDesc}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
