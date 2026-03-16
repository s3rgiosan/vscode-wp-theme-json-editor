import { type ReactNode, useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "../../store/editorStore";
import { formatLabel, singularize } from "../../utils/formatLabel";
import { buildPresetCssVarName } from "../../utils/cssVariables";
import { Description } from "../Description";
import {
  INPUT_CLASS,
  DELETE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
  CSS_VAR_PREVIEW_CLASS,
  ACCORDION_HEADER_CLASS,
} from "../styles";
import { ItemPropertyField, type ItemPropertySchema } from "./ItemPropertyField";
import { UnitsSelector, isUnitsArray } from "./UnitsSelector";

interface ArrayFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly path: string[];
  readonly schema: Record<string, unknown>;
  readonly value: unknown[];
}

export function ArrayField({
  label,
  description,
  path,
  schema,
  value,
}: ArrayFieldProps) {
  const setField = useEditorStore((s) => s.setField);
  const removeItem = useEditorStore((s) => s.removeItem);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set(),
  );

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const itemSchema = useMemo(() => {
    const items = schema["items"];
    return typeof items === "object" && items !== null
      ? (items as Record<string, unknown>)
      : {};
  }, [schema]);

  const itemType = typeof itemSchema["type"] === "string" ? itemSchema["type"] : "object";

  const itemProperties = useMemo(() => {
    const props = itemSchema["properties"];
    return typeof props === "object" && props !== null
      ? (props as Record<string, ItemPropertySchema>)
      : {};
  }, [itemSchema]);

  const requiredFields = useMemo(() => {
    const req = itemSchema["required"];
    return Array.isArray(req) ? new Set(req as string[]) : new Set<string>();
  }, [itemSchema]);

  const isSimpleArray = itemType === "string" || itemType === "number";

  const handleAddItem = useCallback(() => {
    if (isSimpleArray) {
      setField(path, [...value, ""]);
    } else {
      const newItem: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(itemProperties)) {
        if (propSchema.default !== undefined) {
          newItem[key] = structuredClone(propSchema.default);
        } else if (propSchema.type === "array") {
          newItem[key] = [];
        } else if (propSchema.type === "boolean") {
          newItem[key] = false;
        } else {
          newItem[key] = "";
        }
      }
      setField(path, [...value, newItem]);
    }
  }, [isSimpleArray, value, path, setField, itemProperties]);

  const getValidationErrors = useCallback(
    (itemObj: Record<string, unknown>): Map<string, string> => {
      const errors = new Map<string, string>();
      for (const field of requiredFields) {
        const val = itemObj[field];
        if (val === undefined || val === null || val === "") {
          errors.set(field, `${formatLabel(field)} is required`);
        }
      }
      return errors;
    },
    [requiredFields],
  );

  const showUnitsSelector = isSimpleArray && isUnitsArray(path);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        {!showUnitsSelector && (
          <button
            onClick={handleAddItem}
            className={PRIMARY_BUTTON_CLASS}
          >
            + Add
          </button>
        )}
      </div>
      {description && <Description text={description} className="mb-2" />}
      {!showUnitsSelector && value.length === 0 && (
        <p className="text-[11px] text-vscode-description-fg italic">
          No items. Click &quot;+ Add&quot; to create one.
        </p>
      )}

      {showUnitsSelector ? (
        <UnitsSelector
          value={value.filter((v): v is string => typeof v === "string")}
          path={path}
          setField={setField}
        />
      ) : isSimpleArray ? (
        <SimpleArrayItems
          value={value}
          path={path}
          itemType={itemType}
          setField={setField}
          removeItem={removeItem}
        />
      ) : (
        <ObjectArrayItems
          value={value}
          path={path}
          itemProperties={itemProperties}
          requiredFields={requiredFields}
          expandedIndices={expandedIndices}
          toggleExpanded={toggleExpanded}
          setField={setField}
          removeItem={removeItem}
          getValidationErrors={getValidationErrors}
        />
      )}
    </div>
  );
}

// --- Simple array (string/number items) ---

interface SimpleArrayItemsProps {
  value: unknown[];
  path: string[];
  itemType: string;
  setField: (path: string[], value: unknown) => void;
  removeItem: (path: string[], index: number) => void;
}

function SimpleArrayItems({
  value,
  path,
  itemType,
  setField,
  removeItem,
}: SimpleArrayItemsProps) {
  return (
    <div className="space-y-1.5">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type={itemType === "number" ? "number" : "text"}
            value={
              typeof item === "string" || typeof item === "number"
                ? String(item)
                : ""
            }
            onChange={(e) => {
              const newArr = [...value];
              newArr[index] =
                itemType === "number"
                  ? parseFloat(e.target.value) || 0
                  : e.target.value;
              setField(path, newArr);
            }}
            placeholder={`${singularize(formatLabel(path[path.length - 1] ?? "Item"))} ${index + 1}`}
            className={`flex-1 ${INPUT_CLASS}`}
          />
          <button
            onClick={() => removeItem(path, index)}
            className={DELETE_BUTTON_CLASS}
            title="Remove item"
          >
            {"\u2715"}
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Object array (items with properties) ---

interface ObjectArrayItemsProps {
  value: unknown[];
  path: string[];
  itemProperties: Record<string, ItemPropertySchema>;
  requiredFields: Set<string>;
  expandedIndices: Set<number>;
  toggleExpanded: (index: number) => void;
  setField: (path: string[], value: unknown) => void;
  removeItem: (path: string[], index: number) => void;
  getValidationErrors: (item: Record<string, unknown>) => Map<string, string>;
}

function ObjectArrayItems({
  value,
  path,
  itemProperties,
  requiredFields,
  expandedIndices,
  toggleExpanded,
  setField,
  removeItem,
  getValidationErrors,
}: ObjectArrayItemsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemIds = useMemo(
    () => value.map((_, i) => `item-${i}`),
    [value],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = [...value];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setField(path, reordered);
    },
    [value, path, setField, itemIds],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {value.map((item, index) => (
            <SortableArrayItem
              key={itemIds[index]}
              id={itemIds[index] ?? `item-${index}`}
              item={item}
              index={index}
              value={value}
              path={path}
              itemProperties={itemProperties}
              requiredFields={requiredFields}
              isExpanded={expandedIndices.has(index)}
              toggleExpanded={toggleExpanded}
              setField={setField}
              removeItem={removeItem}
              getValidationErrors={getValidationErrors}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- Sortable array item ---

interface SortableArrayItemProps {
  id: string;
  item: unknown;
  index: number;
  value: unknown[];
  path: string[];
  itemProperties: Record<string, ItemPropertySchema>;
  requiredFields: Set<string>;
  isExpanded: boolean;
  toggleExpanded: (index: number) => void;
  setField: (path: string[], value: unknown) => void;
  removeItem: (path: string[], index: number) => void;
  getValidationErrors: (item: Record<string, unknown>) => Map<string, string>;
}

function SortableArrayItem({
  id,
  item,
  index,
  value,
  path,
  itemProperties,
  requiredFields,
  isExpanded,
  toggleExpanded,
  setField,
  removeItem,
  getValidationErrors,
}: SortableArrayItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const itemObj =
    typeof item === "object" && item !== null
      ? (item as Record<string, unknown>)
      : {};
  const errors = getValidationErrors(itemObj);

  const contextName = singularize(formatLabel(path[path.length - 1] ?? "Item"));
  const itemLabel =
    typeof itemObj["title"] === "string" && itemObj["title"] !== ""
      ? itemObj["title"]
      : typeof itemObj["name"] === "string" && itemObj["name"] !== ""
        ? itemObj["name"]
        : typeof itemObj["slug"] === "string" && itemObj["slug"] !== ""
          ? itemObj["slug"]
          : `${contextName} ${index + 1}`;

  const hasErrors = errors.size > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded ${hasErrors ? "border-vscode-error-fg" : "border-vscode-panel-border"}`}
    >
      <div className={ACCORDION_HEADER_CLASS}>
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-vscode-description-fg hover:text-vscode-fg shrink-0 inline-flex items-center justify-center w-4 h-4 text-[10px] -translate-y-px"
          title="Drag to reorder"
        >
          {"\u2630"}
        </span>
        {/* Title */}
        <button
          onClick={() => toggleExpanded(index)}
          className="flex-1 text-left text-xs font-medium flex items-center gap-1 hover:opacity-80 truncate"
        >
          {itemLabel}
          {hasErrors && (
            <span className="text-vscode-error-fg" title="Has validation errors">
              {"\u26A0"}
            </span>
          )}
        </button>
        {/* Delete */}
        <button
          onClick={() => removeItem(path, index)}
          className={DELETE_BUTTON_CLASS}
          title="Remove item"
        >
          {"\u2715"}
        </button>
        {/* Expand/collapse indicator */}
        <button
          onClick={() => toggleExpanded(index)}
          className="text-[10px] hover:opacity-80 shrink-0 ml-1.5"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "\u25BC" : "\u25B6"}
        </button>
      </div>
      {isExpanded && (
        <div className="px-3 py-2 space-y-2">
          {Object.entries(itemProperties).map(
            ([propKey, propSchema]) => (
              <div key={propKey}>
                <ItemPropertyField
                  propKey={propKey}
                  propSchema={propSchema}
                  itemObj={itemObj}
                  index={index}
                  value={value}
                  path={path}
                  setField={setField}
                  required={requiredFields.has(propKey)}
                  error={errors.get(propKey)}
                />
                {propKey === "slug" && (
                  <CssVarPreview path={path} slug={itemObj["slug"]} />
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// --- CSS variable preview ---

function CssVarPreview({ path, slug }: { path: string[]; slug: unknown }) {
  if (typeof slug !== "string" || !slug) return null;
  const varName = buildPresetCssVarName(path, slug);
  if (!varName) return null;
  return (
    <div className={CSS_VAR_PREVIEW_CLASS} title={varName}>
      {varName}
    </div>
  );
}
