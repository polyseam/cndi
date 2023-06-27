import { emitExitEvent, getPrettyJSONString } from "src/utils.ts";
import { getCoreEnvLines } from "src/deployment-targets/shared.ts";

import {
  CNDIConfig,
  DeploymentTarget,
  EnvCommentEntry,
  EnvLines,
  EnvValueEntry,
  SealedSecretsKeys,
} from "src/types.ts";

import { POLYSEAM_TEMPLATE_DIRECTORY } from "src/templates/knownTemplates.ts";

import {
  ccolors,
  Checkbox,
  Confirm,
  deepMerge,
  Input,
  JSONC,
  List,
  Number,
  prompt,
  Secret,
  Select,
  Toggle,
} from "deps";

import getReadmeForProject from "src/outputs/readme.ts";

const useTemplateLabel = ccolors.faded(
  "\nsrc/templates/useTemplate.ts:",
);

type TemplatePromptTypeNames =
  | "Input"
  | "Secret"
  | "Confirm"
  | "Toggle"
  | "Select"
  | "List"
  | "Checkbox"
  | "Number"
  | "Comment";

function getPromptModuleForType(
  type: TemplatePromptTypeNames,
) {
  switch (type) {
    case "Input":
      return Input;
    case "Secret":
      return Secret;
    case "Confirm":
      return Confirm;
    case "Toggle":
      return Toggle;
    case "Select":
      return Select;
    case "List":
      return List;
    case "Checkbox":
      return Checkbox;
    case "Number":
      return Number;
    case "Comment":
      return "Comment";
    default:
      throw new Error(`Unknown prompt type ${type}`);
  }
}

interface TemplatePrompt {
  name: string;
  message: string;
  type: TemplatePromptTypeNames;
  default: string;
  comment?: string;
  hint?: string;
  transform?: (value: string) => string;
  validate?: (value: string) => boolean | string;
}

interface TemplateEnvEntry {
  comment?: string;
  name?: string;
  value?: string;
}

interface TemplateEnvCommentEntry extends TemplateEnvEntry {
  comment: string;
}

interface TemplateEnvValueEntry extends TemplateEnvEntry {
  name: string;
  value: string;
}

interface Template {
  prompts: Array<TemplatePrompt>;
  outputs: {
    "cndi-config": CNDIConfig;
    "env": {
      entries?: Array<TemplateEnvCommentEntry | TemplateEnvValueEntry>;
      extend_basic_env: DeploymentTarget;
    };
    "readme": {
      extend_basic_readme: DeploymentTarget;
      template_section?: string;
    };
  };
}

export interface TemplateResult {
  "cndiConfig": CNDIConfig;
  "env": EnvLines;
  "readme": string;
}

interface CNDIGeneratedValues {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIAdminPassword: string;
}

interface CndiConfigPromptResponses {
  [key: string]: string;
}

function replaceRange(
  s: string,
  start: number,
  end: number,
  substitute: string,
) {
  return s.substring(0, start) + substitute + s.substring(end);
}

// returns a string where templated values are replaced with their literal values from prompt responses
export function literalizeTemplateValuesInString(
  cndiConfigPromptResponses: CndiConfigPromptResponses,
  stringToLiteralize: string,
): string {
  let literalizedString = stringToLiteralize;

  let indexOfOpeningBraces = literalizedString.indexOf("{{");
  let indexOfClosingBraces = literalizedString.indexOf("}}");

  // loop so long as there is '{{ something }}' in the string
  while (
    indexOfOpeningBraces !== -1 && indexOfClosingBraces !== -1 &&
    literalizedString.indexOf(
        "$.cndi.prompts.responses.",
      ) < indexOfClosingBraces &&
    literalizedString.indexOf(
        "$.cndi.prompts.responses.",
      ) > indexOfOpeningBraces
  ) {
    const contentsOfFirstPair = literalizedString.substring(
      indexOfOpeningBraces + 2,
      indexOfClosingBraces,
    );

    const trimmedContents = contentsOfFirstPair.trim();
    const [_, key] = trimmedContents.split("$.cndi.prompts.responses.");
    const valueToSubstitute = cndiConfigPromptResponses[key];

    if (key) {
      literalizedString = replaceRange(
        literalizedString,
        indexOfOpeningBraces,
        indexOfClosingBraces + 2,
        `${valueToSubstitute}`,
      );
    }
    indexOfOpeningBraces = literalizedString.indexOf(
      "{{",
    );
    indexOfClosingBraces = literalizedString.indexOf(
      "}}",
    );
  }

  return literalizedString;
}

async function fetchAndCombineTemplateObjects(
  templateURLs: Array<URL>,
): Promise<Template> {
  let templateObject: Template;

  for (const tURL of templateURLs) {
    let tFetchResponse: Response;
    let tText: string;
    let tObj: Template;

    try {
      tFetchResponse = await fetch(tURL);
      tText = await tFetchResponse.text();
    } catch (fetchError) {
      console.error(
        useTemplateLabel,
        ccolors.error("could not fetch template from"),
        ccolors.user_input(`"${tURL}"`),
      );
      console.log(ccolors.caught(fetchError, 1201));
      await emitExitEvent(1201);
      Deno.exit(1201);
    }

    try {
      tObj = JSONC.parse(tText) as unknown as Template;
    } catch (parseError) {
      console.error(
        useTemplateLabel,
        ccolors.user_input(`"${tURL}"`),
        ccolors.error("did not contain valid JSONC for Template"),
      );
      console.log(ccolors.caught(parseError, 1202));
      await emitExitEvent(1202);
      Deno.exit(1202);
    }

    // @deno-lint-ignore
    if (!templateObject!) {
      templateObject = tObj;
    }

    // combine prompts
    templateObject.prompts = templateObject.prompts.map((prompt) => {
      const indexOfMutual = tObj.prompts.findIndex((
        p,
      ) => (p.name === prompt.name));
      if (indexOfMutual === -1) return prompt;
      return tObj.prompts[indexOfMutual] = prompt;
    });

    // combine outputs.cndi-config
    const tCndiConfig = tObj.outputs["cndi-config"];

    templateObject.outputs["cndi-config"] = deepMerge({
      ...templateObject.outputs["cndi-config"],
    }, {
      ...tCndiConfig,
    });

    // combine outputs.env
    const tEnv = tObj.outputs["env"];
    templateObject.outputs.env.entries?.map((entry) => {
      const indexOfMutual = tEnv.entries?.findIndex((
        e,
      ) => (e.name === entry.name));

      if (tEnv.entries && indexOfMutual && indexOfMutual > -1) {
        return tEnv?.entries[indexOfMutual];
      }
      return entry;
    });
    if (tEnv.extend_basic_env) {
      templateObject.outputs.env.extend_basic_env = tEnv.extend_basic_env;
    }

    // combine outputs.readme
    const tReadme = tObj.outputs["readme"];
    if (tReadme.extend_basic_readme) {
      templateObject.outputs.readme.extend_basic_readme =
        tReadme.extend_basic_readme;
    }
    if (tReadme.template_section) {
      templateObject.outputs.readme.template_section +=
        tReadme.template_section;
    }
  }

  return templateObject!;
}

export default async function useTemplates(
  templateLocations: string[],
  opt: {
    project_name: string;
    cndiGeneratedValues: CNDIGeneratedValues;
    interactive: boolean;
  },
): Promise<TemplateResult> {
  const templateURLs: Array<URL> = [];

  const { cndiGeneratedValues, interactive } = opt;

  for (let templateLocation of templateLocations) {
    try {
      const templateUrl = new URL(templateLocation);
      templateURLs.push(templateUrl);
    } catch {
      // if it's not a valid URL, assume it's a Polyseasm named template
      const validTargets = [
        { name: "aws", aliasFor: "ec2" },
        { name: "ec2" },
        { name: "eks" },
        { name: "azure" },
        { name: "gcp" },
      ];

      const validTarget = validTargets.find((target) => {
        return templateLocation.startsWith(target.name);
      });

      if (
        !validTarget
      ) {
        // it's not a valid template target
        console.error(
          useTemplateLabel,
          ccolors.key_name(`"${templateLocation}"`),
          ccolors.error("is not a valid template name"),
        );
        await emitExitEvent(1200);
        Deno.exit(1200);
      } else if (validTarget?.aliasFor) {
        templateLocation = templateLocation.replace(
          validTarget.name,
          validTarget.aliasFor,
        );
      }
      templateURLs.push(
        new URL(
          `${templateLocation}.jsonc`,
          POLYSEAM_TEMPLATE_DIRECTORY,
        ),
      );
    }
  }

  const templateObject = await fetchAndCombineTemplateObjects(templateURLs);
  console.log("templateObject", templateObject);

  const coreEnvLines = await getCoreEnvLines(
    cndiGeneratedValues,
    templateObject.outputs.env.extend_basic_env,
    interactive,
  );

  const cndiConfigPromptDefinitions = templateObject.prompts ||
    [];

  const defaultCndiConfigValues: Record<string, string> = {};

  const cndiConfigPrompts = cndiConfigPromptDefinitions.map(
    (promptDefinition) => {
      defaultCndiConfigValues[promptDefinition.name] = promptDefinition?.default
        ? promptDefinition.default
        : "";
      return {
        ...promptDefinition,
        message: ccolors.prompt(promptDefinition.message),
        type: getPromptModuleForType(promptDefinition.type),
      };
    },
  );

  const cndiConfigPromptResponses = opt.interactive // deno-lint-ignore no-explicit-any
    ? await prompt(cndiConfigPrompts as unknown as any)
    : defaultCndiConfigValues;

  // pretty printing is required to play nice with {{ }} templating
  const cndiConfigStringified = getPrettyJSONString(
    templateObject.outputs["cndi-config"],
  );

  const literalizedCndiConfig = await literalizeTemplateValuesInString(
    cndiConfigPromptResponses,
    cndiConfigStringified,
  );

  let cndiConfig;

  try {
    cndiConfig = {
      project_name: opt.project_name,
      ...JSON.parse(literalizedCndiConfig),
    };
  } catch {
    throw new Error("Invalid template['cndi-config'] generated");
  }

  const templateEnvLines = [];

  for (const p of templateObject?.outputs?.env?.entries || []) {
    if (p.comment?.length) {
      const { comment } = p;
      templateEnvLines.push({ comment } as EnvCommentEntry);
      continue;
    } else {
      if (!p?.value || typeof p?.value !== "string") {
        throw new Error(`Invalid env entry ${JSON.stringify(p)}`);
      }

      if (!p?.name || typeof p?.name !== "string") {
        throw new Error(`Invalid env entry ${JSON.stringify(p)}`);
      }

      const value = literalizeTemplateValuesInString(
        cndiConfigPromptResponses,
        p.value,
      );

      templateEnvLines.push(
        { value: { [p.name]: value } } as EnvValueEntry,
      );
    }
  }

  const env = [...coreEnvLines, ...templateEnvLines];

  const coreReadme = await getReadmeForProject({
    nodeKind: templateObject.outputs.readme.extend_basic_readme,
    project_name: opt.project_name,
  });

  const templateReadmeText = templateObject.outputs?.readme?.template_section
    ? literalizeTemplateValuesInString(
      cndiConfigPromptResponses,
      templateObject.outputs.readme.template_section,
    )
    : "";

  const readme = `${coreReadme}\n\n${templateReadmeText}`;

  return {
    cndiConfig,
    env,
    readme,
  };
}
