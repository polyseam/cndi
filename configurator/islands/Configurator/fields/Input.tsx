import { useEffect, useRef, useState } from "preact/hooks";

import {
  ConfiguratorPromptFieldError,
  ConfiguratorPromptFieldLabel,
  type ConfiguratorPromptFieldProps,
  deriveInputAttribute,
} from "islands/Configurator/ConfiguratorPromptField.tsx";

const INPUT_TYPE_MAP = {
  Secret: "password",
  Input: "text",
  Number: "number",
  List: "text",
} as const;

type TSpec = keyof typeof INPUT_TYPE_MAP;

import {
  validateFields,
  type ValidationError,
} from "islands/Configurator/responseValidators.ts";

const DEBOUNCE_TIME = 500; // ms

const parseValue = (value: string, tSpec: TSpec) => {
  switch (tSpec) {
    case "Number":
      return Number(value);
    case "List":
      return value.split(",");
    default:
      return value;
  }
};

export const Input = (props: ConfiguratorPromptFieldProps) => {
  const { spec, onChange } = props;
  const { name, message } = spec;
  const defaultValue = deriveInputAttribute(spec.default);

  // assume that type is one of the keys of INPUT_TYPE_MAP
  const tSpec = spec.type as TSpec;

  const type = INPUT_TYPE_MAP?.[tSpec] ?? "text";

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const debounceTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    onChange(name, parseValue(defaultValue, tSpec));
    return () => {
      onChange(name, "");
    };
  }, []);

  return (
    <ConfiguratorPromptFieldLabel message={message}>
      <ConfiguratorPromptFieldError errors={errors} responseName={name} />
      <input
        class="p-2 m-2 rounded text-gray-200  placeholder:text-gray-400 bg-darkpurp font-mono"
        type={type}
        id={name}
        name={name}
        placeholder={name}
        defaultValue={defaultValue}
        onInput={(e) => {
          const responseName = e.currentTarget.name;
          const value = parseValue(e.currentTarget.value, tSpec);

          // If a timer is already running, cancel it
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

          // Start a new debounce timer
          debounceTimerRef.current = setTimeout(() => {
            if (value !== "") {
              const errs: ValidationError[] = validateFields(value, spec);
              setErrors(() => errs);
            } else {
              setErrors(() => []);
            }
            onChange(responseName, value);
          }, DEBOUNCE_TIME);
        }}
      />
    </ConfiguratorPromptFieldLabel>
  );
};
