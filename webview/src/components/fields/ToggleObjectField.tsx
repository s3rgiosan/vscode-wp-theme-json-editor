import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";

type ToggleObjectValue = "true" | "false" | "object" | "unset";

interface ToggleObjectFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  /** Current mode derived from the stored value. */
  readonly mode: ToggleObjectValue;
  readonly onModeChange: (mode: ToggleObjectValue) => void;
  /** Object property fields, rendered when mode is "object". */
  readonly children: ReactNode;
}

const options: { label: string; value: ToggleObjectValue }[] = [
  { label: "True", value: "true" },
  { label: "False", value: "false" },
  { label: "Unset", value: "unset" },
];

export const ToggleObjectField = memo(function ToggleObjectField({
  label,
  description,
  mode,
  onModeChange,
  children,
}: ToggleObjectFieldProps) {
  const id = useId();

  const isObject = mode === "object";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-center gap-3" role="radiogroup">
        {options.map((opt) => (
          <label
            key={opt.label}
            className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none"
          >
            <input
              type="radio"
              name={id}
              checked={
                opt.value === "true" ? mode === "true" || isObject :
                opt.value === mode
              }
              onChange={() => onModeChange(opt.value)}
              className="appearance-none w-3.5 h-3.5 rounded-full border-[1.5px] border-vscode-fg/50 checked:bg-vscode-checkbox-bg checked:border-[4px] checked:border-vscode-checkbox-fg cursor-pointer"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {description && <Description text={description} className="mt-0.5" />}
      {(mode === "true" || isObject) && (
        <div className="mt-2 pl-3 border-l border-vscode-panel-border space-y-2">
          {children}
        </div>
      )}
    </div>
  );
});
