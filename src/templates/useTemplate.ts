import { getPrettyJSONString, loadRemoteJSONC } from "src/utils.ts";
import { getCoreEnvLines } from "src/deployment-targets/shared.ts";

import {
  CNDIConfig,
  DeploymentTarget,
  EnvCommentEntry,
  EnvLines,
  EnvValueEntry,
  SealedSecretsKeys,
} from "src/types.ts";

import {
  ccolors,
  Checkbox,
  Confirm,
  Input,
  List,
  Number,
  prompt,
  Secret,
  Select,
  Toggle,
} from "deps";

import getReadmeForProject from "src/outputs/readme.ts";
import { POLYSEAM_TEMPLATE_DIRECTORY } from "src/templates/knownTemplates.ts";

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

interface TemplateResult {
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
function literalizeTemplateValuesInString(
  cndiConfigPromptResponses: CndiConfigPromptResponses,
  stringToLiteralize: string,
): string {
  let literalizedString = stringToLiteralize;

  let indexOfOpeningBraces = literalizedString.indexOf("{{");
  let indexOfClosingBraces = literalizedString.indexOf("}}");

  // loop so long as there is '{{ something }}' in the string
  while (
    indexOfOpeningBraces !== -1 && indexOfClosingBraces !== -1 &&
    indexOfClosingBraces > indexOfOpeningBraces
  ) {
    console.log("indexOfOpeningBraces", indexOfOpeningBraces);
    console.log("indexOfClosingBraces", indexOfClosingBraces);

    const contentsOfFirstPair = literalizedString.substring(
      indexOfOpeningBraces + 2,
      indexOfClosingBraces,
    );

    console.log("contentsOfFirstPair", contentsOfFirstPair);

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
      indexOfClosingBraces,
    );
    indexOfClosingBraces = literalizedString.indexOf(
      "}}",
      indexOfClosingBraces,
    );
  }

  return literalizedString;
}

export default async function useTemplate(
  templateLocation: string,
  opt: {
    project_name: string;
    cndiGeneratedValues: CNDIGeneratedValues;
    interactive: boolean;
  },
): Promise<TemplateResult> {
  let templateUrl: URL;
  const { cndiGeneratedValues, interactive } = opt;

  try {
    templateUrl = new URL(templateLocation);
  } catch {
    // if it's not a valid URL, assume it's a Polyseam named template
    templateUrl = new URL(
      `${templateLocation}.json`,
      POLYSEAM_TEMPLATE_DIRECTORY,
    );
  }
  const templateObject = await loadRemoteJSONC(
    templateUrl,
  ) as unknown as Template;

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
    cndiConfig = JSON.parse(literalizedCndiConfig);
    cndiConfig.project_name = opt.project_name;
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
