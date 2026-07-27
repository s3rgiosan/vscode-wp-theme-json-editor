import { useState, useMemo, useCallback } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useFieldValue } from "../../hooks/useFieldValue";
import { Description } from "../Description";
import {
  INPUT_CLASS,
  DELETE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../styles";

interface BlockTypesFieldProps {
  /** Path to the block types array, e.g. ["blockTypes"]. */
  readonly path: string[];
  /** List of core block names from the schema marker. */
  readonly blockNames: string[];
  /** Description from the schema. */
  readonly description?: string;
}

/**
 * Renders the `blockTypes` array as a block picker.
 *
 * Selected blocks appear as removable chips; a filterable list adds core
 * blocks, and any name typed into the filter can be added as a custom block
 * so third-party blocks are reachable. Order is not meaningful — WordPress
 * registers the variation on every listed block — so the chips are not
 * sortable.
 */
export function BlockTypesField({
  path,
  blockNames,
  description,
}: BlockTypesFieldProps) {
  const rawValue = useFieldValue(path);
  const setField = useEditorStore((s) => s.setField);
  const removeField = useEditorStore((s) => s.removeField);
  const [filter, setFilter] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  const selected = useMemo(
    () => (Array.isArray(rawValue) ? (rawValue as string[]) : []),
    [rawValue],
  );

  const filteredAvailableBlocks = useMemo(() => {
    const lower = filter.trim().toLowerCase();
    return blockNames
      .filter((name) => !selected.includes(name))
      .filter((name) => !lower || name.toLowerCase().includes(lower));
  }, [blockNames, selected, filter]);

  const handleAddBlock = useCallback(
    (blockName: string) => {
      if (selected.includes(blockName)) {
        return;
      }
      setField(path, [...selected, blockName]);
      setFilter("");
      setShowSelector(false);
    },
    [path, selected, setField],
  );

  const handleRemoveBlock = useCallback(
    (blockName: string) => {
      const remaining = selected.filter((name) => name !== blockName);
      if (remaining.length === 0) {
        removeField(path);
        return;
      }
      setField(path, remaining);
    },
    [path, selected, setField, removeField],
  );

  const customName = filter.trim();
  const canAddCustomName =
    customName !== "" &&
    !selected.includes(customName) &&
    !blockNames.includes(customName);

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
            + Add block
          </button>
        </div>

        {showSelector && (
          <div className="border border-tje-panel-border rounded overflow-hidden p-2 mb-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search blocks (e.g. core/group) or enter custom block name..."
              className={`w-full ${INPUT_CLASS} mb-2`}
            />
            {filteredAvailableBlocks.length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                {filteredAvailableBlocks.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddBlock(name)}
                    className="w-full text-left px-3 py-1 hover:bg-tje-list-hover hover:text-tje-list-hover-fg transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {canAddCustomName && (
              <button
                onClick={() => handleAddBlock(customName)}
                className="w-full text-left px-3 py-1.5 mt-1 border-t border-tje-panel-border hover:bg-tje-list-hover hover:text-tje-list-hover-fg"
              >
                Add custom block: <strong>{customName}</strong>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selected blocks */}
      {selected.length === 0 ? (
        <p className="text-secondary text-tje-description-fg italic">
          No block types selected. Without one this file is a whole-site style
          variation.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
          {selected.map((blockName) => (
            <li
              key={blockName}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-tje-panel-border bg-tje-sidebar-bg"
            >
              <span className="font-mono">{blockName}</span>
              <button
                onClick={() => handleRemoveBlock(blockName)}
                aria-label={`Remove ${blockName}`}
                className={DELETE_BUTTON_CLASS}
              >
                {"✕"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
