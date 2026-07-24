import { useMemo, useCallback } from "react";
import { useEditorStore } from "../store/editorStore";
import { formatLabel } from "../utils/formatLabel";
import { searchSchema, type SearchResult } from "../utils/searchSchema";
import {
  VARIATION_KEYS,
  VARIATION_SECTION,
  VARIATION_FILES_SECTION,
  hasVariationSection,
} from "../utils/variationSection";

interface SectionDef {
  readonly key: string;
  readonly label: string;
}

const TOP_SECTIONS: SectionDef[] = [
  { key: VARIATION_SECTION, label: "Variation" },
  { key: "settings", label: "Settings" },
  { key: "styles", label: "Styles" },
  { key: "customTemplates", label: "Custom Templates" },
  { key: "templateParts", label: "Template Parts" },
  { key: "patterns", label: "Patterns" },
  { key: VARIATION_FILES_SECTION, label: "Variations" },
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
  // Derived as booleans so edits to themeJson don't re-render the sidebar.
  const showVariation = useEditorStore((s) =>
    hasVariationSection(s.filePath, s.themeJson),
  );
  // Sibling variation files are listed from the theme.json that owns them,
  // not from another variation.
  const showVariationFiles = useEditorStore(
    (s) =>
      s.variations.length > 0 && !hasVariationSection(s.filePath, s.themeJson),
  );

  const schemaProps =
    typeof schema === "object" && schema !== null
      ? ((schema as Record<string, unknown>)["properties"] as
          | Record<string, unknown>
          | undefined)
      : undefined;

  const availableSections = useMemo(
    () =>
      TOP_SECTIONS.filter(({ key }) => {
        // The Variation section is synthetic — it groups root-level keys that
        // have no schema node of their own.
        if (key === VARIATION_SECTION) {
          return showVariation;
        }
        if (key === VARIATION_FILES_SECTION) {
          return showVariationFiles;
        }
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
    [schemaProps, showExperimental, showVariation, showVariationFiles],
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
      const isVariationKey =
        parts.length === 1 &&
        (VARIATION_KEYS as readonly string[]).includes(parts[0] ?? "");
      if (isVariationKey) {
        // Root variation keys live in the synthetic Variation section.
        setActiveSection(VARIATION_SECTION);
      } else if (parts.length <= 2) {
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
      className="w-52 shrink-0 border-r border-tje-panel-border bg-tje-sidebar-bg overflow-y-auto flex flex-col"
      aria-label="Theme JSON sections"
    >
      {/* Global search */}
      <div className="p-2 border-b border-tje-panel-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all properties..."
            aria-label="Search all properties"
            className="w-full px-2 py-1.5 pr-7 rounded border border-tje-input-border bg-tje-input-bg text-tje-input-fg focus:outline-none focus:border-tje-focus-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-tje-description-fg hover:text-tje-fg"
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
      <div className="px-3 py-4 text-secondary text-tje-description-fg text-center">
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
            className="w-full text-left px-3 py-1.5 hover:bg-tje-list-hover hover:text-tje-list-hover-fg transition-colors"
          >
            <div className="font-medium">{formatLabel(result.key)}</div>
            <div className="text-tertiary text-tje-description-fg mt-0.5">
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
          <li key={key} className="m-0" role="treeitem" aria-expanded={isTopActive && subSections.length > 0 ? true : undefined}>
            <button
              onClick={() => setActiveSection(key)}
              aria-current={isTopActive ? "true" : undefined}
              className={`w-full text-left px-4 py-2 font-medium transition-colors ${
                isTopActive
                  ? "text-tje-list-active-fg bg-tje-list-active"
                  : "hover:bg-tje-list-hover hover:text-tje-list-hover-fg"
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
                    <li key={subKey} className="m-0">
                      <button
                        onClick={() => setActiveSection(subKey)}
                        className={`w-full text-left pl-8 pr-4 py-1.5 text-secondary transition-colors ${
                          isSubActive
                            ? "text-tje-list-active-fg bg-tje-list-active"
                            : "hover:bg-tje-list-hover hover:text-tje-list-hover-fg text-tje-description-fg"
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
