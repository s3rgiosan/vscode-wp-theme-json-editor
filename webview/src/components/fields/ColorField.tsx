import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";
import { TextInputWithAutocomplete } from "../Autocomplete";
import { INPUT_CLASS, LABEL_CLASS, COLOR_SWATCH_CLASS } from "../styles";

interface ColorFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export const ColorField = memo(function ColorField({
  label,
  description,
  value,
  onChange,
}: ColorFieldProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {description && <Description text={description} className="mb-1" />}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className={COLOR_SWATCH_CLASS}
        />
        <TextInputWithAutocomplete
          id={id}
          value={value}
          onChange={onChange}
          placeholder="#000000"
          className={`flex-1 ${INPUT_CLASS}`}
        />
      </div>
    </div>
  );
});
