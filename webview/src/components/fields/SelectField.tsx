import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";
import { LABEL_CLASS } from "../styles";

interface SelectFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly options: readonly string[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export const SelectField = memo(function SelectField({
  label,
  description,
  options,
  value,
  onChange,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {description && <Description text={description} className="mb-1" />}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs rounded border border-vscode-dropdown-border bg-vscode-dropdown-bg text-vscode-dropdown-fg focus:outline-none focus:border-vscode-focus-border"
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});
