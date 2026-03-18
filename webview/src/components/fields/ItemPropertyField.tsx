import { useId } from "react";
import { formatLabel } from "../../utils/formatLabel";
import { TextInputWithAutocomplete } from "../Autocomplete";
import { getBooleanObjectSchema } from "../fieldRenderer";
import {
  SUB_LABEL_CLASS,
  ERROR_CLASS,
  COLOR_SWATCH_CLASS,
  inputClass,
} from "../styles";

export interface ItemPropertySchema {
  readonly type?: string;
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly default?: unknown;
  readonly items?: Record<string, unknown>;
  readonly oneOf?: readonly Record<string, unknown>[];
  readonly anyOf?: readonly Record<string, unknown>[];
  readonly properties?: Record<string, ItemPropertySchema>;
}

interface ItemPropertyFieldProps {
  readonly propKey: string;
  readonly propSchema: ItemPropertySchema;
  readonly itemObj: Record<string, unknown>;
  readonly index: number;
  readonly value: unknown[];
  readonly path: string[];
  readonly setField: (path: string[], value: unknown) => void;
  readonly required?: boolean;
  readonly error?: string;
}

/** Renders a single property field within an array item (enum, boolean, color, text, etc.). */
export function ItemPropertyField({
  propKey,
  propSchema,
  itemObj,
  index,
  value,
  path,
  setField,
  required,
  error,
}: ItemPropertyFieldProps) {
  const propValue = itemObj[propKey];
  const propType = propSchema.type ?? "string";
  const propLabel = formatLabel(propKey);
  const requiredMark = required ? <span className="text-vscode-error-fg ml-0.5">*</span> : null;

  const updateField = (newValue: unknown) => {
    let newItem: Record<string, unknown>;
    if (newValue === undefined) {
      newItem = { ...itemObj };
      delete newItem[propKey];
    } else {
      newItem = { ...itemObj, [propKey]: newValue };
    }
    const newArr = [...value];
    newArr[index] = newItem;
    setField(path, newArr);
  };

  // Color key -> color picker + text input
  if (propType === "string" && /color$/i.test(propKey)) {
    return (
      <div>
        <label className={SUB_LABEL_CLASS}>
          {propLabel}{requiredMark}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typeof propValue === "string" && propValue ? propValue : "#000000"}
            onChange={(e) => updateField(e.target.value)}
            className={COLOR_SWATCH_CLASS}
          />
          <TextInputWithAutocomplete
            value={typeof propValue === "string" ? propValue : ""}
            onChange={(val) => updateField(val)}
            placeholder="#000000"
            className={`flex-1 ${inputClass(!!error)}`}
          />
        </div>
        {error && (
          <p className={ERROR_CLASS}>{error}</p>
        )}
      </div>
    );
  }

  // Enum -> select
  if (propSchema.enum && propSchema.enum.length > 0) {
    return (
      <div>
        <label className={SUB_LABEL_CLASS}>
          {propLabel}{requiredMark}
        </label>
        <select
          value={typeof propValue === "string" ? propValue : ""}
          onChange={(e) => updateField(e.target.value)}
          className="w-full px-2 py-1 text-xs rounded border border-vscode-input-border bg-vscode-input-bg text-vscode-input-fg focus:outline-none focus:border-vscode-focus-border"
        >
          <option value="">-- Select --</option>
          {propSchema.enum.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {String(opt)}
            </option>
          ))}
        </select>
        {error && (
          <p className={ERROR_CLASS}>{error}</p>
        )}
      </div>
    );
  }

  // Boolean + object oneOf (e.g. fontSizes[].fluid)
  const boolObjSchema = getBooleanObjectSchema(propSchema as Record<string, unknown>);
  if (boolObjSchema) {
    return (
      <ItemBooleanObjectField
        propKey={propKey}
        propValue={propValue}
        objectSchema={boolObjSchema}
        updateField={updateField}
        required={required}
        error={error}
      />
    );
  }

  // Boolean -> checkbox
  if (propType === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={typeof propValue === "boolean" ? propValue : false}
          onChange={(e) => updateField(e.target.checked)}
          className="accent-vscode-checkbox-bg"
        />
        <label className="text-[11px] text-vscode-description-fg">
          {propLabel}{requiredMark}
        </label>
      </div>
    );
  }

  // Nested array of strings (e.g. postTypes, colors)
  if (propType === "array") {
    const arrValue = Array.isArray(propValue) ? propValue : [];
    const nestedItemType = propSchema.items?.["type"] as string | undefined;
    const isColorArray = nestedItemType === "string" && /colors?$/i.test(propKey);

    if (nestedItemType === "string") {
      return (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[11px] text-vscode-description-fg">
              {propLabel}{requiredMark}
            </label>
            <button
              onClick={() => updateField([...arrValue, isColorArray ? "#000000" : ""])}
              className="px-1.5 py-0.5 text-[10px] rounded bg-vscode-button-secondary-bg text-vscode-button-secondary-fg hover:opacity-80"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1">
            {arrValue.map((subItem, subIndex) => (
              <div key={subIndex} className="flex items-center gap-1">
                {isColorArray && (
                  <input
                    type="color"
                    value={typeof subItem === "string" && subItem ? subItem : "#000000"}
                    onChange={(e) => {
                      const newArr = [...arrValue];
                      newArr[subIndex] = e.target.value;
                      updateField(newArr);
                    }}
                    className={COLOR_SWATCH_CLASS}
                  />
                )}
                <input
                  type="text"
                  value={typeof subItem === "string" ? subItem : ""}
                  onChange={(e) => {
                    const newArr = [...arrValue];
                    newArr[subIndex] = e.target.value;
                    updateField(newArr);
                  }}
                  className="flex-1 px-2 py-0.5 text-xs rounded border border-vscode-input-border bg-vscode-input-bg text-vscode-input-fg focus:outline-none focus:border-vscode-focus-border"
                />
                <button
                  onClick={() => {
                    const newArr = arrValue.filter((_, i) => i !== subIndex);
                    updateField(newArr);
                  }}
                  className="text-[10px] text-vscode-error-fg hover:opacity-80 px-0.5"
                >
                  {"\u2715"}
                </button>
              </div>
            ))}
          </div>
          {error && (
            <p className={ERROR_CLASS}>{error}</p>
          )}
        </div>
      );
    }
  }

  // Number
  if (propType === "number" || propType === "integer") {
    return (
      <div>
        <label className={SUB_LABEL_CLASS}>
          {propLabel}{requiredMark}
        </label>
        <input
          type="number"
          step={propType === "integer" ? 1 : "any"}
          value={typeof propValue === "number" ? propValue : ""}
          onChange={(e) => {
            const parsed =
              propType === "integer"
                ? parseInt(e.target.value, 10)
                : parseFloat(e.target.value);
            if (!isNaN(parsed)) {
              updateField(parsed);
            }
          }}
          className={`w-full ${inputClass(!!error)}`}
        />
        {error && (
          <p className={ERROR_CLASS}>{error}</p>
        )}
      </div>
    );
  }

  // Default: string text input
  return (
    <div>
      <label className={SUB_LABEL_CLASS}>
        {propLabel}{requiredMark}
      </label>
      <TextInputWithAutocomplete
        value={typeof propValue === "string" ? propValue : ""}
        onChange={(val) => updateField(val)}
        className={`w-full ${inputClass(!!error)}`}
      />
      {error && (
        <p className={ERROR_CLASS}>{error}</p>
      )}
    </div>
  );
}

const RADIO_CLASS =
  "appearance-none w-3.5 h-3.5 rounded-full border-[1.5px] border-vscode-fg/50 checked:bg-vscode-checkbox-bg checked:border-[4px] checked:border-vscode-checkbox-fg cursor-pointer";

/** Inline boolean+object field for array items (e.g. fontSizes[].fluid). */
function ItemBooleanObjectField({
  propKey,
  propValue,
  objectSchema,
  updateField,
  required,
  error,
}: {
  propKey: string;
  propValue: unknown;
  objectSchema: ItemPropertySchema;
  updateField: (value: unknown) => void;
  required?: boolean;
  error?: string;
}) {
  const id = useId();
  const propLabel = formatLabel(propKey);
  const requiredMark = required ? <span className="text-vscode-error-fg ml-0.5">*</span> : null;

  const mode =
    propValue === undefined ? "unset" :
    propValue === true ? "true" :
    propValue === false ? "false" :
    typeof propValue === "object" && propValue !== null ? "object" :
    "unset";

  const objValue =
    typeof propValue === "object" && propValue !== null
      ? (propValue as Record<string, unknown>)
      : {};

  const objectProperties = objectSchema.properties ?? {};

  return (
    <div>
      <label className={SUB_LABEL_CLASS}>
        {propLabel}{requiredMark}
      </label>
      <div className="flex items-center gap-3 mt-0.5" role="radiogroup">
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
          <input
            type="radio"
            name={id}
            checked={mode === "true" || mode === "object"}
            onChange={() => updateField({})}
            className={RADIO_CLASS}
          />
          True
        </label>
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
          <input
            type="radio"
            name={id}
            checked={mode === "false"}
            onChange={() => updateField(false)}
            className={RADIO_CLASS}
          />
          False
        </label>
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
          <input
            type="radio"
            name={id}
            checked={mode === "unset"}
            onChange={() => updateField(undefined)}
            className={RADIO_CLASS}
          />
          Unset
        </label>
      </div>
      {(mode === "true" || mode === "object") && (
        <div className="mt-2 pl-3 border-l border-vscode-panel-border space-y-2">
          {Object.entries(objectProperties).map(([key, propSch]) => {
            const subValue = objValue[key];
            return (
              <div key={key}>
                <label className={SUB_LABEL_CLASS}>{formatLabel(key)}</label>
                <TextInputWithAutocomplete
                  value={typeof subValue === "string" ? subValue : ""}
                  onChange={(val) => {
                    const updated = { ...objValue, [key]: val };
                    // Remove empty string properties to keep the object clean
                    const cleaned: Record<string, unknown> = {};
                    for (const [k, v] of Object.entries(updated)) {
                      if (v !== "") cleaned[k] = v;
                    }
                    updateField(Object.keys(cleaned).length > 0 ? cleaned : {});
                  }}
                  placeholder={typeof propSch.description === "string" ? propSch.description : ""}
                  className={`w-full ${inputClass(false)}`}
                />
              </div>
            );
          })}
        </div>
      )}
      {error && <p className={ERROR_CLASS}>{error}</p>}
    </div>
  );
}
