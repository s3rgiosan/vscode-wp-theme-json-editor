import { useState, useMemo, useCallback } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useFieldValue } from "../../hooks/useFieldValue";
import { Description } from "../Description";
import { SectionPanel } from "../SectionPanel";
import { CssField } from "./CssField";
import { INPUT_CLASS, DELETE_BUTTON_CLASS, PRIMARY_BUTTON_CLASS, ACCORDION_HEADER_CLASS } from "../styles";

interface BlockMapFieldProps {
  /** Path to this block map in the themeJson, e.g. ["settings", "blocks"]. */
  readonly path: string[];
  /** List of core block names from the schema stub. */
  readonly blockNames: string[];
  /** Per-block schema resolved from the stub, shared by all core blocks. */
  readonly blockSchema?: Record<string, unknown>;
  /** Description from the schema. */
  readonly description?: string;
  /** If true, entries are free-form (any key allowed, e.g. style variations). */
  readonly freeForm?: boolean;
}

/**
 * Renders an accordion-based block override editor.
 *
 * - Configured blocks appear as collapsible accordion cards.
 * - A search input at the top lets the user add new blocks.
 * - Core blocks (core/*) render the full per-block property panel.
 * - Custom blocks (non-core) render a JSON textarea.
 */
export function BlockMapField({
  path,
  blockNames,
  blockSchema,
  description,
  freeForm = false,
}: BlockMapFieldProps) {
  const rawValue = useFieldValue(path);
  const setField = useEditorStore((s) => s.setField);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  const blockData = useMemo(() => {
    return typeof rawValue === "object" && rawValue !== null
      ? (rawValue as Record<string, unknown>)
      : undefined;
  }, [rawValue]);

  const configuredBlocks = useMemo(() => {
    if (!blockData) {
      return [];
    }
    return Object.keys(blockData).sort();
  }, [blockData]);

  const coreBlockSet = useMemo(() => new Set(blockNames), [blockNames]);

  const filteredAvailableBlocks = useMemo(() => {
    const lower = filter.toLowerCase();
    return blockNames
      .filter((name) => !configuredBlocks.includes(name))
      .filter((name) => !filter || name.toLowerCase().includes(lower));
  }, [blockNames, configuredBlocks, filter]);

  const toggleExpanded = useCallback((blockName: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockName)) {
        next.delete(blockName);
      } else {
        next.add(blockName);
      }
      return next;
    });
  }, []);

  const handleAddBlock = useCallback(
    (blockName: string) => {
      setField([...path, blockName], {});
      setExpandedBlocks((prev) => new Set(prev).add(blockName));
      setFilter("");
      setShowSelector(false);
    },
    [path, setField],
  );

  const handleAddCustomBlock = useCallback(() => {
    const name = filter.trim();
    if (!name) {
      return;
    }
    setField([...path, name], {});
    setExpandedBlocks((prev) => new Set(prev).add(name));
    setFilter("");
    setShowSelector(false);
  }, [path, setField, filter]);

  const handleRemoveBlock = useCallback(
    (blockName: string) => {
      if (!blockData) {
        return;
      }
      const updated = { ...blockData };
      delete updated[blockName];
      setField(path, updated);
      setExpandedBlocks((prev) => {
        const next = new Set(prev);
        next.delete(blockName);
        return next;
      });
    },
    [blockData, path, setField],
  );

  return (
    <div>
      {description && <Description text={description} className="mb-3" />}

      {/* Add block control */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className={PRIMARY_BUTTON_CLASS}
          >
            {freeForm ? "+ Add variation" : "+ Add block"}
          </button>
        </div>

        {showSelector && (
          <div className="border border-vscode-panel-border rounded p-2 mb-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={freeForm ? "Enter variation name (e.g. bold, outline)..." : "Search blocks (e.g. core/paragraph) or enter custom block name..."}
              className={`w-full ${INPUT_CLASS} mb-2`}
            />
            {!freeForm && filteredAvailableBlocks.length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                {filteredAvailableBlocks.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddBlock(name)}
                    className="w-full text-left px-3 py-1 text-xs hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg transition-colors"
                  >
                    {formatBlockName(name)}
                    <span className="ml-1 text-vscode-description-fg">{name}</span>
                  </button>
                ))}
              </div>
            )}
            {filter.trim() && (freeForm || !coreBlockSet.has(filter.trim())) && (
              <button
                onClick={handleAddCustomBlock}
                className="w-full text-left px-3 py-1.5 text-xs mt-1 border-t border-vscode-panel-border hover:bg-vscode-list-hover hover:text-vscode-list-hover-fg"
              >
                Add{freeForm ? " variation" : " custom block"}: <strong>{filter.trim()}</strong>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Configured blocks accordion */}
      {configuredBlocks.length === 0 && (
        <p className="text-[11px] text-vscode-description-fg italic">
          {freeForm
          ? "No style variations configured. Click \"+ Add variation\" to start."
          : "No block overrides configured. Click \"+ Add block\" to start."}
        </p>
      )}

      <div className="space-y-2">
        {configuredBlocks.map((blockName) => {
          const isExpanded = expandedBlocks.has(blockName);
          const isCoreBlock = coreBlockSet.has(blockName);

          return (
            <div
              key={blockName}
              className="border border-vscode-panel-border rounded"
            >
              <div className={ACCORDION_HEADER_CLASS}>
                {/* Title (clickable to toggle) */}
                <button
                  onClick={() => toggleExpanded(blockName)}
                  className="flex-1 text-left text-xs font-medium flex items-center gap-1 hover:opacity-80 truncate"
                >
                  {formatBlockName(blockName)}
                  <span className="text-[10px] text-vscode-description-fg font-normal">
                    {blockName}
                  </span>
                  {!isCoreBlock && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-vscode-badge-bg text-vscode-badge-fg">
                      custom
                    </span>
                  )}
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleRemoveBlock(blockName)}
                  className={DELETE_BUTTON_CLASS}
                  title="Remove block overrides"
                >
                  {"\u2715"}
                </button>
                {/* Expand/collapse indicator */}
                <button
                  onClick={() => toggleExpanded(blockName)}
                  className="text-[10px] hover:opacity-80 shrink-0 ml-1.5"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "\u25BC" : "\u25B6"}
                </button>
              </div>
              {isExpanded && (
                <div className="px-3 py-2">
                  {(isCoreBlock || freeForm) && blockSchema ? (
                    <BlockPanel
                      path={[...path, blockName]}
                      blockSchema={blockSchema}
                    />
                  ) : (
                    <CustomBlockPanel
                      path={[...path, blockName]}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renders the settings/styles panel for a core block or style variation
 * using the shared per-block schema.
 */
function BlockPanel({
  path,
  blockSchema,
}: {
  path: string[];
  blockSchema: Record<string, unknown>;
}) {
  // Filter out "blocks" and "variations" to avoid infinite recursion
  const filteredProperties: Record<string, unknown> = {};
  const props = (blockSchema["properties"] ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(props)) {
    if (key === "blocks" || key === "variations") {
      continue;
    }
    filteredProperties[key] = value;
  }

  return (
    <SectionPanel
      schemaNode={{ type: "object", properties: filteredProperties } as Record<string, unknown>}
      path={path}
      depth={1}
    />
  );
}

/**
 * Renders a JSON textarea for custom (non-core) blocks.
 * The schema sets `additionalProperties: false` on `settings.blocks`,
 * so custom blocks aren't officially supported — this is an escape hatch.
 */
function CustomBlockPanel({ path }: { path: string[] }) {
  const value = useFieldValue(path);
  const setField = useEditorStore((s) => s.setField);

  const jsonStr = value !== undefined ? JSON.stringify(value, null, 2) : "{}";

  return (
    <div>
      <p className="text-[11px] text-vscode-description-fg mb-2">
        Custom block — edit the JSON directly.
      </p>
      <CssField
        label={<span>Block JSON</span>}
        value={jsonStr}
        jsonMode
        onChange={(v) => {
          try {
            const parsed: unknown = JSON.parse(v);
            setField(path, parsed);
          } catch {
            // Don't update store with invalid JSON
          }
        }}
      />
    </div>
  );
}

/** Convert "core/paragraph" → "Paragraph", "my-plugin/hero" → "Hero". */
function formatBlockName(name: string): string {
  const parts = name.split("/");
  const blockName = parts[parts.length - 1] ?? name;
  return blockName
    .replace(/-/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}
