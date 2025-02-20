// Initially thoguht to share code with `jsr:@cndi/use-template` but the UI is asynchronous and that limits overlap
// instead this Gizmo is built from scratch with shared principals
// remember: make it work, then make it pretty

import { useContext, useEffect, useState } from "preact/hooks";

import SourceShower from "islands/SourceShower.tsx";

import { processMacrosInCNDITemplateObject } from "islands/Configurator/macros.ts";

import type {
  CNDIBlockSpec,
  CNDIPrompt,
  CNDIState,
  CNDITemplateObject,
  CNDITemplatePromptResponsePrimitive,
} from "islands/Configurator/shared.ts";

import { YAML } from "islands/Configurator/shared.ts";

import { ConfiguratorGizmoContext } from "islands/Configurator/ConfiguratorGizmoContext.tsx";
import { ConfiguratorGizmoProvider } from "islands/Configurator/ConfiguratorContextProvider.tsx";

import { ConfiguratorPromptField } from "islands/Configurator/ConfiguratorPromptField.tsx";

import { evaluateCNDITemplateCondition } from "islands/Configurator/conditionals.ts";
import { FormPanel } from "islands/Configurator/FormPanel.tsx";
import { CNDICreateConfiguratorCLISnippet } from "islands/Configurator/ConfiguratorCLISnippet.tsx";

type CNDIFileMap = {
  "README.md": string;
  ".env": string;
  "cndi_config.yaml": string;
  [filename: string]: string;
};

export type UseTemplateResult = {
  responses: Record<string, CNDITemplatePromptResponsePrimitive>;
  files: CNDIFileMap;
};

// ordered list
export type CNDIGUIError = { title: string; description: string; code: number };
export type CNDIGUIErrors = CNDIGUIError[];

type ConfiguratorGizmoProps = {
  templateIdentifier: string;
  templateObject: CNDITemplateObject;
};

declare global {
  interface Window {
    analytics?: {
      // deno-lint-ignore no-explicit-any
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

const processTemplateObject = async (
  obj: CNDITemplateObject,
  $cndi: CNDIState,
): Promise<void> => {
  // FIX: this function is serializing condition[0] as 'undefined'
  const processed = (await processMacrosInCNDITemplateObject(
    obj,
    $cndi,
  )) as CNDITemplateObject;

  const promises = processed.prompts.map(async (spec, index) => {
    if (!spec?.name) {
      return null;
    }

    const conditionMet = Array.isArray(spec?.condition)
      ? await evaluateCNDITemplateCondition(spec.condition, $cndi)
      : true;

    return {
      ...spec,
      index,
      conditionMet,
    };
  });

  const newPrompts = (await Promise.all(promises)).filter(Boolean);

  $cndi.setters.prompts.set(newPrompts as CNDIPrompt[]);
};

const ConfiguratorGizmoForm = () => {
  const ctx = useContext(ConfiguratorGizmoContext);

  const [prompts, setPrompts] = useState([] as CNDIPrompt[]);

  const [blocks, _setBlocks] = useState(new Map<string, CNDIBlockSpec>());
  const [_errors, _setErrors] = useState<CNDIGUIErrors>([]);

  const [responses, setResponses] = useState(
    new Map<string, CNDITemplatePromptResponsePrimitive>(),
  );

  const $cndi: CNDIState = {
    values: {
      blocks,
      prompts,
      responses,
    },
    setters: {
      responses: {
        upsert: (key: string, value: CNDITemplatePromptResponsePrimitive) => {
          setResponses((prev) => {
            const newMap = new Map(prev);
            newMap.set(key, value);
            return newMap;
          });
        },
      },
      prompts: {
        set: (prompts: CNDIPrompt[]) => {
          setPrompts((_prev) => {
            return [...prompts];
          });
        },
      },
    },
  };

  const responseRecord = Object.fromEntries(Array.from(responses.entries()));

  useEffect(() => {
    processTemplateObject(
      ctx.templateObjectSource as CNDITemplateObject,
      $cndi,
    );
  }, [responses]);

  const activePrompts = prompts.filter(({ conditionMet }) => conditionMet);

  const project_name = responseRecord?.project_name ?? "my-cndi-project";
  const yamlHint =
    `# this ${project_name}.responses.yaml file can be passed into \`cndi create -r\` to bootstrap your project`;
  const deployment_target_distribution = responseRecord
    ?.deployment_target_distribution as string | undefined;
  const deployment_target_provider = responseRecord
    ?.deployment_target_provider as string | undefined;
  return (
    <>
      <FormPanel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {activePrompts.map((p) => (
            <ConfiguratorPromptField
              // when a prompt instance is replaced, ensure the new instance is unique
              key={`${p.name}-${p?.options?.join("-") || p.type}`}
              spec={p}
              onChange={(responseName, newResponseValue) => {
                setResponses((prev) => {
                  const newMap = new Map(prev);
                  if (newResponseValue === "") {
                    newMap.delete(responseName);
                  } else {
                    newMap.set(responseName, newResponseValue);
                  }
                  return newMap;
                });
              }}
            />
          ))}
          <div class="grid grid-cols-1">
            <button
              class="w-auto justify-self-start p-2 m-2 text-lg bg-purple-200 text-softgrey rounded-lg inline-block"
              type="button"
              onClick={() => {
                downloadString(
                  `${yamlHint}\n\n${YAML.stringify(responseRecord)}`,
                  `${project_name}.responses.yaml`,
                );
                // deno-lint-ignore no-window
                window?.analytics?.track("Configurator Responses Downloaded", {
                  responseNames: Object.keys(responseRecord),
                  templateIdentifier: ctx.templateIdentifier,
                  deployment_target_distribution,
                  deployment_target_provider,
                });
              }}
            >
              Download Config File
            </button>
            <span class="p-2 m-2 ml-4">then run</span>
            <CNDICreateConfiguratorCLISnippet
              project_name={`${project_name}`}
              deployment_target_distribution={deployment_target_distribution}
              deployment_target_provider={deployment_target_provider}
              templateIdentifier={ctx.templateIdentifier!}
            />
          </div>
        </form>
      </FormPanel>
      <SourceShower
        source={`${yamlHint}\n\n${YAML.stringify(responseRecord)}`}
        name="Config File"
      />
    </>
  );
};

function downloadString(content: string, fileName: string) {
  // 1. Create a Blob from the string
  const blob = new Blob([content], { type: "text/plain" });

  // 2. Generate a temporary object URL
  const url = URL.createObjectURL(blob);

  // 3. Create and trigger a download link
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  // 4. Clean up by revoking the Object URL and removing the element
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function ConfiguratorGizmo(props: ConfiguratorGizmoProps) {
  return (
    <ConfiguratorGizmoProvider
      templateObjectSource={props.templateObject}
      templateIdentifier={props.templateIdentifier}
    >
      <ConfiguratorGizmoForm />
    </ConfiguratorGizmoProvider>
  );
}
