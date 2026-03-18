import { useState, useCallback } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useFieldValue } from "../../hooks/useFieldValue";
import { buildCssVarName } from "../../utils/cssVariables";
import { Description } from "../Description";
import { TextInputWithAutocomplete } from "../Autocomplete";
import { INPUT_CLASS, DELETE_BUTTON_CLASS, CSS_VAR_PREVIEW_CLASS, ACCORDION_HEADER_CLASS } from "../styles";

interface CustomVariablesFieldProps {
  /** Path to the custom object in themeJson, e.g. ["settings", "custom"]. */
  readonly path: string[];
  /** Description from the schema. */
  readonly description?: string;
}

/**
 * Renders a nested key-value editor for `settings.custom`.
 *
 * WordPress generates CSS custom properties from this structure:
 * `{ "lineHeight": { "small": 1.3 } }` → `--wp--custom--line-height--small: 1.3`
 *
 * All entries (groups and leaf values) render as collapsible accordions.
 * Keys can be renamed inline. Groups and values can be added and removed.
 */
export function CustomVariablesField({
  path,
  description,
}: CustomVariablesFieldProps) {
  const value = useFieldValue(path);
  const setField = useEditorStore((s) => s.setField);
  const data =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return (
    <div>
      {description && <Description text={description} className="mb-3" />}
      <NestedEditor data={data} path={path} setField={setField} depth={0} />
    </div>
  );
}

// --- Nested editor ---

interface NestedEditorProps {
  data: Record<string, unknown>;
  path: string[];
  setField: (path: string[], value: unknown) => void;
  depth: number;
}

/**
 * Recursively renders a nested key-value tree as collapsible accordions.
 * Both groups (objects) and leaf values (strings/numbers) use the same
 * accordion pattern for a consistent UI.
 */
function NestedEditor({ data, path, setField, depth }: NestedEditorProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"string" | "group">("string");

  const entries = Object.entries(data);

  const handleAddEntry = useCallback(() => {
    const key = newKey.trim();
    if (!key || key in data) {
      return;
    }
    if (newType === "group") {
      setField([...path, key], {});
    } else {
      const val = newValue.trim();
      const num = Number(val);
      const parsed = !isNaN(num) && val !== "" ? num : val;
      setField([...path, key], parsed);
    }
    setNewKey("");
    setNewValue("");
  }, [newKey, newValue, newType, data, path, setField]);

  const handleRemoveEntry = useCallback(
    (key: string) => {
      const updated = { ...data };
      delete updated[key];
      setField(path, updated);
    },
    [data, path, setField],
  );

  const handleRenameEntry = useCallback(
    (oldKey: string, newKeyName: string) => {
      const trimmed = newKeyName.trim();
      if (!trimmed || trimmed === oldKey || trimmed in data) {
        return;
      }
      // Rebuild the object preserving insertion order with the renamed key
      const updated: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (k === oldKey) {
          updated[trimmed] = v;
        } else {
          updated[k] = v;
        }
      }
      setField(path, updated);
    },
    [data, path, setField],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddEntry();
      }
    },
    [handleAddEntry],
  );

  return (
    <div className={depth > 0 ? "ml-3 mt-1 border-l border-vscode-panel-border pl-3" : ""}>
      {entries.length === 0 && depth === 0 && (
        <p className="text-[11px] text-vscode-description-fg italic mb-2">
          No custom variables defined.
        </p>
      )}

      <div className="space-y-1.5">
        {entries.map(([key, val]) => {
          const isGroup = typeof val === "object" && val !== null && !Array.isArray(val);
          const entryPath = [...path, key];

          return (
            <EntryAccordion
              key={key}
              entryKey={key}
              value={val}
              isGroup={isGroup}
              entryPath={entryPath}
              setField={setField}
              depth={depth}
              onRemove={() => handleRemoveEntry(key)}
              onRename={(newName) => handleRenameEntry(key, newName)}
            />
          );
        })}
      </div>

      {/* Add new entry */}
      <div className="flex items-center gap-1.5 mt-3">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as "string" | "group")}
          className="px-1.5 py-1 text-xs rounded border border-vscode-input-border bg-vscode-input-bg text-vscode-input-fg shrink-0"
        >
          <option value="string">Value</option>
          <option value="group">Group</option>
        </select>
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Name"
          className={`flex-1 ${INPUT_CLASS}`}
        />
        {newType === "string" && (
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Value"
            className={`flex-1 ${INPUT_CLASS}`}
          />
        )}
        <button
          onClick={handleAddEntry}
          disabled={!newKey.trim()}
          className="px-2 py-1 text-[11px] rounded bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover disabled:text-vscode-disabled-fg disabled:opacity-60 shrink-0"
        >
          Add
        </button>
      </div>
      <p className="text-[10px] text-vscode-description-fg mt-1">
        Use camelCase for the name (e.g. lineHeight, baseFont).
      </p>
    </div>
  );
}

// --- Accordion entry (shared by groups and leaf values) ---

interface EntryAccordionProps {
  entryKey: string;
  value: unknown;
  isGroup: boolean;
  entryPath: string[];
  setField: (path: string[], value: unknown) => void;
  depth: number;
  onRemove: () => void;
  onRename: (newName: string) => void;
}

/**
 * A single accordion entry. Groups show nested children when expanded.
 * Leaf values show a value input and CSS variable preview when expanded.
 * All accordions are collapsed by default.
 */
function EntryAccordion({
  entryKey,
  value,
  isGroup,
  entryPath,
  setField,
  depth,
  onRemove,
  onRename,
}: EntryAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingName, setPendingName] = useState(entryKey);

  const groupData = isGroup ? (value as Record<string, unknown>) : null;
  const childCount = groupData ? Object.keys(groupData).length : 0;
  const strValue = !isGroup && (typeof value === "string" || typeof value === "number")
    ? String(value)
    : "";

  // Live CSS variable preview based on the pending (in-progress) name
  const livePath = [...entryPath.slice(0, -1), pendingName];
  const liveCssVar = buildCssVarName(livePath.slice(2));

  return (
    <div className="border border-vscode-panel-border rounded">
      <div className={ACCORDION_HEADER_CLASS}>
        {/* Title (clickable to toggle) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-xs font-medium flex items-center gap-1 hover:opacity-80 truncate"
          title={entryKey}
        >
          {entryKey}
          {isGroup && (
            <span className="text-[10px] text-vscode-description-fg font-normal ml-1">
              ({childCount})
            </span>
          )}
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={DELETE_BUTTON_CLASS}
          title="Remove"
        >
          {"\u2715"}
        </button>

        {/* Expand/collapse indicator (with left margin for spacing from delete) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] hover:opacity-80 shrink-0 ml-1.5"
          aria-expanded={expanded}
        >
          {expanded ? "\u25BC" : "\u25B6"}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-2 py-2 space-y-2">
          {/* Name field (editable key) — extra bottom margin for groups */}
          <div className={isGroup ? "mb-3" : ""}>
            <label className="block text-[10px] text-vscode-description-fg mb-0.5">
              Name
            </label>
            <NameField
              entryKey={entryKey}
              onRename={onRename}
              onPendingChange={setPendingName}
            />
            {/* Live CSS variable preview — only for leaf values (groups don't generate variables) */}
            {!isGroup && (
              <div className={CSS_VAR_PREVIEW_CLASS} title={liveCssVar}>
                {liveCssVar}
              </div>
            )}
          </div>

          {isGroup && groupData ? (
            <NestedEditor
              data={groupData}
              path={entryPath}
              setField={setField}
              depth={depth + 1}
            />
          ) : (
            <div>
              <label className="block text-[10px] text-vscode-description-fg mb-0.5">
                Value
              </label>
              <TextInputWithAutocomplete
                value={strValue}
                onChange={(val) => {
                  const num = Number(val);
                  const parsed = !isNaN(num) && val.trim() !== "" ? num : val;
                  setField(entryPath, parsed);
                }}
                className={`w-full ${INPUT_CLASS}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Name field (inline rename) ---

/**
 * Editable name field for renaming a custom variable key.
 * Shows the current key in an input. On blur or Enter, triggers rename.
 */
function NameField({
  entryKey,
  onRename,
  onPendingChange,
}: {
  entryKey: string;
  onRename: (newName: string) => void;
  /** Called on every keystroke so the parent can show a live preview. */
  onPendingChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(entryKey);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== entryKey) {
      onRename(trimmed);
    }
  }, [value, entryKey, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onPendingChange?.(e.target.value);
      }}
      onBlur={handleSubmit}
      onKeyDown={handleKeyDown}
      className={`w-full ${INPUT_CLASS}`}
    />
  );
}

