import { type ReactNode, useId, memo } from "react";
import { Description } from "../Description";
import { TextInputWithAutocomplete } from "../Autocomplete";
import { INPUT_CLASS, LABEL_CLASS } from "../styles";

interface TextFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export const TextField = memo(function TextField({ label, description, value, onChange }: TextFieldProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {description && <Description text={description} className="mb-1" />}
      <TextInputWithAutocomplete
        id={id}
        value={value}
        onChange={onChange}
        className={`w-full ${INPUT_CLASS}`}
      />
    </div>
  );
});
