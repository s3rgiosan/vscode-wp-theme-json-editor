import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";
import { INPUT_CLASS, LABEL_CLASS } from "../styles";

interface NumberFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly value: number;
  readonly isInteger?: boolean;
  readonly onChange: (value: number) => void;
}

export const NumberField = memo(function NumberField({
  label,
  description,
  value,
  isInteger,
  onChange,
}: NumberFieldProps) {
  const id = useId();

  const handleChange = (raw: string) => {
    const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {description && <Description text={description} className="mb-1" />}
      <input
        id={id}
        type="number"
        value={value}
        step={isInteger ? 1 : "any"}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full ${INPUT_CLASS}`}
      />
    </div>
  );
});
