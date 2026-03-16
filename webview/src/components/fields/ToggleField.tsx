import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";

interface ToggleFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}

export const ToggleField = memo(function ToggleField({
  label,
  description,
  checked,
  onChange,
}: ToggleFieldProps) {
  const id = useId();

  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-vscode-checkbox-bg"
      />
      <div>
        <label htmlFor={id} className="text-xs font-medium cursor-pointer">
          {label}
        </label>
        {description && <Description text={description} className="mt-0.5" />}
      </div>
    </div>
  );
});
