import { useMemo, useCallback } from "react";
import { useEditorStore } from "../store/editorStore";
import { formatLabel } from "../utils/formatLabel";
import { searchSchema, type SearchResult } from "../utils/searchSchema";

interface SectionDef {
  readonly key: string;
  readonly label: string;
}

const TOP_SECTIONS: SectionDef[] = [
  { key: "settings", label: "Settings" },
  { key: "styles", label: "Styles" },
  { key: "customTemplates", label: "Custom Templates" },
  { key: "templateParts", label: "Template Parts" },
  { key: "patterns", label: "Patterns" },
];

/** Sections that are too large to render flat — show sub-sections instead. */
const EXPANDABLE_SECTIONS = new Set(["settings", "styles"]);

/**
 * Sidebar navigation with global search and section tree.
 * The search input at the top filters across all schema properties.
 */
export function Sidebar() {
  const schema = useEditorStore((s) => s.schema);
  const activeSection = useEditorStore((s) => s.activeSection);
  const setActiveSection = useEditorStore((s) => s.setActiveSection);
  const showExperimental = useEditorStore((s) => s.showExperimental);
  const searchQuery = useEditorStore((s) => s.searchQuery);
  const setSearchQuery = useEditorStore((s) => s.setSearchQuery);

  const schemaProps =
    typeof schema === "object" && schema !== null
      ? ((schema as Record<string, unknown>)["properties"] as
          | Record<string, unknown>
          | undefined)
      : undefined;

  const availableSections = useMemo(
    () =>
      TOP_SECTIONS.filter(({ key }) => {
        if (!schemaProps) {
          return false;
        }
        const sectionSchema = schemaProps[key];
        if (!sectionSchema || typeof sectionSchema !== "object") {
          return false;
        }
        const sectionObj = sectionSchema as Record<string, unknown>;
        if (
          sectionObj["x-wpthemejsoneditor-experimental"] === true &&
          !showExperimental
        ) {
          return false;
        }
        return true;
      }),
    [schemaProps, showExperimental],
  );

  // Global search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !schema) {
      return [];
    }
    return searchSchema(schema as Record<string, unknown>, searchQuery, 30);
  }, [schema, searchQuery]);

  const handleSearchResultClick = useCallback(
    (result: SearchResult) => {
      // Navigate to the nearest section that contains this property.
      // For paths like "settings.color.custom", navigate to "settings.color".
      const parts = result.path.split(".");
      if (parts.length <= 2) {
        setActiveSection(result.path);
      } else {
        // Navigate to the parent section so the property is visible
        setActiveSection(parts.slice(0, 2).join("."));
      }
      setSearchQuery("");
    },
    [setActiveSection, setSearchQuery],
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <nav
      className="w-52 shrink-0 border-r border-vscode-panel-border bg-vscode-sidebar-bg overflow-y-auto flex flex-col"
      aria-label="Theme JSON sections"
    >
      {/* Global search */}
      <div className="p-2 border-b border-vscode-panel-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all properties..."
            aria-label="Search all properties"
            className="w-full px-2 py-1.5 pr-7 text-xs rounded border border-vscode-input-border bg-vscode-input-bg text-vscode-input-fg focus:outline-none focus:border-vscode-focus-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-vscode-description-fg hover:text-vscode-fg text-xs"
              aria-label="Clear search"
            >
              {"\u2715"}
            </button>
          )}
        </div>
      </div>

      {/* Search results or section tree */}
      {isSearching ? (
        <SearchResults
          results={searchResults}
          query={searchQuery}
          onResultClick={handleSearchResultClick}
        />
      ) : (
        <SectionTree
          availableSections={availableSections}
          schemaProps={schemaProps}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          showExperimental={showExperimental}
        />
      )}
    </nav>
  );
}

// --- Search results panel ---

/** Renders the global search results with breadcrumb paths. */
function SearchResults({
  results,
  query,
  onResultClick,
}: {
  results: SearchResult[];
  query: string;
  onResultClick: (result: SearchResult) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="px-3 py-4 text-[11px] text-vscode-description-fg text-center">
        No properties match &quot;{query}&quot;
      </div>
    );
  }

  return (
    <ul className="py-1 flex-1 overflow-y-auto" role="listbox" aria-label="Search results">
      {results.map((result) => (
        <li key={result.path} role="option">
          <button
            onClick={() => onResultClick(result)}
            className="w-full text-left px-3 py-1.5 hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg transition-colors"
          >
            <div className="text-xs font-medium">{formatLabel(result.key)}</div>
            <div className="text-[10px] text-vscode-description-fg mt-0.5">
              {result.breadcrumbs.join(" \u203A ")}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

// --- Section tree ---

/** Renders the normal section navigation tree. */
function SectionTree({
  availableSections,
  schemaProps,
  activeSection,
  setActiveSection,
  showExperimental,
}: {
  availableSections: SectionDef[];
  schemaProps: Record<string, unknown> | undefined;
  activeSection: string;
  setActiveSection: (section: string) => void;
  showExperimental: boolean;
}) {
  return (
    <ul className="py-2 flex-1 overflow-y-auto" role="tree">
      {availableSections.map(({ key, label }) => {
        const isTopActive = activeSection === key || activeSection.startsWith(`${key}.`);
        const sectionSchema = schemaProps?.[key] as
          | Record<string, unknown>
          | undefined;
        const isExperimental =
          sectionSchema?.["x-wpthemejsoneditor-experimental"] === true;
        const hasSubSections =
          EXPANDABLE_SECTIONS.has(key) &&
          sectionSchema?.["properties"] !== undefined;

        const subSections = hasSubSections
          ? getSubSections(sectionSchema, showExperimental)
          : [];

        return (
          <li key={key} role="treeitem" aria-expanded={isTopActive && subSections.length > 0 ? true : undefined}>
            <button
              onClick={() => setActiveSection(key)}
              aria-current={isTopActive ? "true" : undefined}
              className={`w-full text-left px-4 py-1.5 text-xs font-medium transition-colors ${
                isTopActive
                  ? "text-vscode-list-active-fg bg-vscode-list-active"
                  : "hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg"
              }`}
            >
              {isExperimental && (
                <span className="mr-1.5" title="Experimental">
                  &#9878;
                </span>
              )}
              {label}
            </button>
            {isTopActive && subSections.length > 0 && (
              <ul className="pb-1">
                {subSections.map((sub) => {
                  const subKey = `${key}.${sub.key}`;
                  const isSubActive = activeSection === subKey;
                  return (
                    <li key={subKey}>
                      <button
                        onClick={() => setActiveSection(subKey)}
                        className={`w-full text-left pl-8 pr-4 py-1 text-[11px] transition-colors ${
                          isSubActive
                            ? "text-vscode-list-active-fg bg-vscode-list-active"
                            : "hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg text-vscode-description-fg"
                        }`}
                      >
                        {sub.isExperimental && (
                          <span className="mr-1" title="Experimental">
                            &#9878;
                          </span>
                        )}
                        {sub.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// --- Helpers ---

interface SubSectionDef {
  key: string;
  label: string;
  isExperimental: boolean;
}

/** Extract sub-section entries from a section schema for the sidebar sub-nav. */
function getSubSections(
  sectionSchema: Record<string, unknown> | undefined,
  showExperimental: boolean,
): SubSectionDef[] {
  if (!sectionSchema) {
    return [];
  }
  const props = sectionSchema["properties"];
  if (typeof props !== "object" || props === null) {
    return [];
  }

  const entries = Object.entries(props as Record<string, unknown>);
  const result: SubSectionDef[] = [];

  for (const [key, value] of entries) {
    if (typeof value !== "object" || value === null) {
      continue;
    }
    const node = value as Record<string, unknown>;
    const isExp = node["x-wpthemejsoneditor-experimental"] === true;
    const isUndoc = node["x-wpthemejsoneditor-undocumented"] === true;

    if ((isExp || isUndoc) && !showExperimental) {
      continue;
    }

    result.push({
      key,
      label: formatLabel(key),
      isExperimental: isExp,
    });
  }

  return result;
}
