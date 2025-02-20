import { type Signal, useComputed, useSignal } from "@preact/signals";
import { abbreviateTemplateIdentifier } from "islands/Configurator/shared.ts";

import { KNOWN_TEMPLATES } from "known-templates";

type Template = {
  name: string; // name as presented to user
  configurator_name?: string; // name of template in https://github.com/polyseam/cndi/tree/main/templates/
};

const templates: Template[] = [
  ...KNOWN_TEMPLATES.filter(({ ga }) => ga).map(
    ({ name, configurator_name }) => ({
      name,
      configurator_name,
    }),
  ),
];

const InactiveTemplateLink = ({ name, configurator_name }: Template) => (
  <a
    class="text-purple-200"
    href={`?t=https://raw.githubusercontent.com/polyseam/cndi/refs/heads/main/templates/${name}.yaml`}
  >
    <button
      type="button"
      class="p-2 m-2 bg-darkpurp focus:ring rounded w-auto font-mono text-lg underline"
    >
      {configurator_name ?? name}
    </button>
  </a>
);

const ActiveTemplateLink = ({ name, configurator_name }: Template) => {
  return (
    <a
      href={`?t=https://raw.githubusercontent.com/polyseam/cndi/refs/heads/main/templates/${name}.yaml`}
    >
      <button
        type="button"
        class="p-2 m-2 bg-darkpurp focus:ring rounded w-auto font-mono text-lg text-white"
      >
        {configurator_name ?? name}
      </button>
    </a>
  );
};

const TemplateLinks = () => {
  let templateParam = null;
  try {
    templateParam = new URL(location.href).searchParams.get("t");
  } catch (_e) {
    // no location object
  }
  return (
    <div class="pl-1 flex-col">
      {templates.map(({ name, configurator_name }) => {
        const isActive = templateParam
          ? abbreviateTemplateIdentifier(templateParam) === name
          : false;

        return isActive
          ? (
            <ActiveTemplateLink
              name={name}
              configurator_name={configurator_name}
            />
          )
          : (
            <InactiveTemplateLink
              name={name}
              configurator_name={configurator_name}
            />
          );
      })}
    </div>
  );
};

export default function TemplateSelector() {
  const templateIdentifier: Signal<string> = useSignal("");
  const shouldShake = useSignal(false); // controls the shake animation
  const isValidTemplateIdentifier = useComputed(() => {
    if (!templateIdentifier.value) return false;
    try {
      new URL(templateIdentifier.value);
      return true;
    } catch {
      return false;
    }
  });
  const placeholder = "https://example.com/template.yaml";
  return (
    <>
      <div class="my-4 p-4 text-purple-200 bg-softgrey rounded">
        <div class="font-bold">Choose A Template:</div>

        <TemplateLinks />

        <div class="m-2 inline-block">OR</div>
        <div class="grid grid-cols-1 space-y-1">
          <label for="template-identifier-field" class="font-bold">
            Enter Your Template URL
          </label>
          <input
            type="text"
            className={`text-black p-2 rounded ${
              shouldShake.value ? "animate-wiggle ring ring-red-500" : ""
            }`}
            name="template-identifier-field"
            aria-invalid={!isValidTemplateIdentifier.value}
            placeholder={placeholder}
            size={placeholder.length}
            onInput={(e) => {
              templateIdentifier.value = e.currentTarget.value;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Prevent form submission if needed
                e.preventDefault();
                if (!isValidTemplateIdentifier.value) {
                  shouldShake.value = true;
                  // Reset the shake flag after the animation (e.g., 500ms)
                  setTimeout(() => {
                    shouldShake.value = false;
                  }, 500);
                  return;
                }
                location.href = `?t=${templateIdentifier.value}`;
              }
            }}
          />
        </div>
        {isValidTemplateIdentifier.value
          ? (
            <div class="text-cyan-400 mt-2 underline">
              <a href={`?t=${templateIdentifier.value}`}>
                configurator.cndi.dev/?t={templateIdentifier.value}
              </a>
            </div>
          )
          : null}
      </div>
    </>
  );
}
