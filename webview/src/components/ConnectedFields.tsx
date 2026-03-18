/**
 * Connected field wrappers that bridge Zustand store subscriptions
 * to presentational leaf field components.
 *
 * Each wrapper subscribes to its own slice of themeJson via useFieldValue,
 * so only the edited field re-renders on keystroke — not the entire form.
 *
 * All wrappers are wrapped with React.memo using a custom comparator
 * that compares fieldPath arrays by value (not reference).
 */
import { type ReactNode, memo } from "react";
import { useEditorStore } from "../store/editorStore";
import { useFieldValue } from "../hooks/useFieldValue";
import { TextField } from "./fields/TextField";
import { NumberField } from "./fields/NumberField";
import { ToggleField } from "./fields/ToggleField";
import { SelectField } from "./fields/SelectField";
import { ColorField } from "./fields/ColorField";
import { CssField } from "./fields/CssField";
import { ArrayField } from "./fields/ArrayField";
import { CustomVariablesField } from "./fields/CustomVariablesField";

/** Compare two string arrays by value. */
function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

interface ConnectedFieldProps {
  readonly fieldPath: string[];
  readonly label: ReactNode;
  readonly description?: string;
}

/** Shallow-compare props, using value equality for fieldPath arrays. */
function connectedFieldPropsEqual(
  prev: ConnectedFieldProps,
  next: ConnectedFieldProps,
): boolean {
  return (
    pathsEqual(prev.fieldPath, next.fieldPath) &&
    prev.label === next.label &&
    prev.description === next.description
  );
}

export const ConnectedToggleField = memo(function ConnectedToggleField({
  fieldPath,
  label,
  description,
}: ConnectedFieldProps) {
  const value = useFieldValue(fieldPath);
  const setField = useEditorStore((s) => s.setField);
  const removeField = useEditorStore((s) => s.removeField);
  return (
    <ToggleField
      label={label}
      description={description}
      value={typeof value === "boolean" ? value : undefined}
      onChange={(v) => {
        if (v === undefined) {
          removeField(fieldPath);
        } else {
          setField(fieldPath, v);
        }
      }}
    />
  );
}, connectedFieldPropsEqual);

interface ConnectedSelectFieldProps extends ConnectedFieldProps {
  readonly options: readonly string[];
}

export const ConnectedSelectField = memo(function ConnectedSelectField({
  fieldPath,
  label,
  description,
  options,
}: ConnectedSelectFieldProps) {
  const value = useFieldValue(fieldPath);
  const setField = useEditorStore((s) => s.setField);
  return (
    <SelectField
      label={label}
      description={description}
      options={options}
      value={typeof value === "string" ? value : ""}
      onChange={(v) => setField(fieldPath, v)}
    />
  );
}, (prev, next) =>
  connectedFieldPropsEqual(prev, next) && prev.options === next.options,
);

export const ConnectedColorField = memo(function ConnectedColorField({
  fieldPath,
  label,
  description,
}: ConnectedFieldProps) {
  const value = useFieldValue(fieldPath);
  const setField = useEditorStore((s) => s.setField);
  return (
    <ColorField
      label={label}
      description={description}
      value={typeof value === "string" ? value : ""}
      onChange={(v) => setField(fieldPath, v)}
    />
  );
}, connectedFieldPropsEqual);

interface ConnectedCssFieldProps extends ConnectedFieldProps {
  readonly jsonMode?: boolean;
}

export const ConnectedCssField = memo(function ConnectedCssField({
  fieldPath,
  label,
  description,
  jsonMode,
}: ConnectedCssFieldProps) {
  const value = useFieldValue(fieldPath);
  const setField = useEditorStore((s) => s.setField);

  if (jsonMode) {
    const jsonStr = value !== undefined ? JSON.stringify(value, null, 2) : "";
    return (
      <CssField
        label={label}
        description={description}
        value={jsonStr}
        jsonMode
        onChange={(v) => {
          try {
            const parsed: unknown = JSON.parse(v);
            setField(fieldPath, parsed);
          } catch {
            // Don't update store with invalid JSON
          }
        }}
      />
    );
  }

  return (
    <CssField
      label={label}
      description={description}
      value={typeof value === "string" ? value : ""}
      onChange={(v) => setField(fieldPath, v)}
    />
  );
}, (prev, next) =>
  connectedFieldPropsEqual(prev, next) && prev.jsonMode === next.jsonMode,
);

interface ConnectedNumberFieldProps extends ConnectedFieldProps {
  readonly isInteger?: boolean;
}

export const ConnectedNumberField = memo(function ConnectedNumberField({
  fieldPath,
  label,
  description,
  isInteger,
}: ConnectedNumberFieldProps) {
  const value = useFieldValue(fieldPath);
  const setField = useEditorStore((s) => s.setField);
  return (
    <NumberField
      label={label}
      description={description}
      value={typeof value === "number" ? value : 0}
      isInteger={isInteger}
      onChange={(v) => setField(fieldPath, v)}
    />
  );
}, (prev, next) =>
  connectedFieldPropsEqual(prev, next) && prev.isInteger === next.isInteger,
);

export const ConnectedTextField = memo(function ConnectedTextField({
  fieldPath,
  label,
  description,
}: ConnectedFieldProps) {
  const value = useFieldValue(fieldPath);
  const setField = useEditorStore((s) => s.setField);
  return (
    <TextField
      label={label}
      description={description}
      value={typeof value === "string" ? value : ""}
      onChange={(v) => setField(fieldPath, v)}
    />
  );
}, connectedFieldPropsEqual);

interface ConnectedArrayFieldProps extends ConnectedFieldProps {
  readonly schema: Record<string, unknown>;
}

export const ConnectedArrayField = memo(function ConnectedArrayField({
  fieldPath,
  label,
  description,
  schema,
}: ConnectedArrayFieldProps) {
  const value = useFieldValue(fieldPath);
  return (
    <ArrayField
      label={label}
      description={description}
      path={fieldPath}
      schema={schema}
      value={Array.isArray(value) ? value : []}
    />
  );
}, (prev, next) =>
  connectedFieldPropsEqual(prev, next) && prev.schema === next.schema,
);

export const ConnectedCustomVariablesField = memo(function ConnectedCustomVariablesField({
  fieldPath,
  description,
}: {
  readonly fieldPath: string[];
  readonly description?: string;
}) {
  return <CustomVariablesField path={fieldPath} description={description} />;
}, (prev, next) =>
  pathsEqual(prev.fieldPath, next.fieldPath) && prev.description === next.description,
);
