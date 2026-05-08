import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";

type TriState = true | false | undefined;

interface ToggleFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly value: TriState;
  readonly onChange: (value: TriState) => void;
}

const options: { label: string; triValue: TriState }[] = [
  { label: "True", triValue: true },
  { label: "False", triValue: false },
  { label: "Unset", triValue: undefined },
];

export const ToggleField = memo(function ToggleField({
  label,
  description,
  value,
  onChange,
}: ToggleFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3" role="radiogroup">
        {options.map((opt) => (
          <label
            key={opt.label}
            className="flex items-center gap-1.5 text-secondary cursor-pointer select-none"
          >
            <input
              type="radio"
              name={id}
              checked={value === opt.triValue}
              onChange={() => onChange(opt.triValue)}
              className="appearance-none w-3.5 h-3.5 rounded-full border-[1.5px] border-tje-fg/50 checked:bg-tje-checkbox-bg checked:border-[4px] checked:border-tje-checkbox-fg cursor-pointer"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {description && <Description text={description} className="mt-0.5" />}
    </div>
  );
});
