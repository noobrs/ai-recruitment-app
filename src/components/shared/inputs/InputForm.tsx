import React from "react";
import InputLabel from "./InputLabel";

interface InputFormProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isValid?: boolean;
  isDisabled?: boolean;
  type?: string;
  className?: string;
  label?: string;
  nullable?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
  value,
  onChange,
  placeholder = "",
  isValid,
  isDisabled = false,
  type = "text",
  className = "",
  label = "",
  nullable = false,
}) => {
  // Determine border color based on validation state
  let borderColor = "border-gray-300";
  if (isValid === true) borderColor = "border-green-500";
  else if (isValid === false) borderColor = "border-red-500";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <InputLabel label={label} nullable={nullable} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={isDisabled}
        className={`w-full px-4 py-3 rounded-md outline-none transition-colors duration-200
        border ${borderColor}
        focus:border-blue-500
        hover:border-blue-400
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
      `}
      />
    </div>
  );
};

export default InputForm;
