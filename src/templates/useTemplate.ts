import { loadRemoteJSONC } from "src/utils.ts";
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
  do_not_wrap?: boolean;
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
  "cndi-config": {
    template: CNDIConfig;
  };
  "env": {
    entries?: Array<TemplateEnvCommentEntry | TemplateEnvValueEntry>;
    extend_basic_env: DeploymentTarget;
  };
  "readme": {
    extend_basic_readme: DeploymentTarget;
    template?: string;
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

// returns a string where templated values are replaced with their literal values
function literalizeTemplateValuesInString(
  cndiConfigPromptResponses: CndiConfigPromptResponses,
  stringToLiteralize: string,
): string {
  let literalizedString = stringToLiteralize;

  // eg: ["argocdDomainName", "argocd.cndi.dev"]
  for (const [key, value] of Object.entries(cndiConfigPromptResponses)) {
    let indexOfOpeningBraces = literalizedString.indexOf("{{");
    let indexOfClosingBraces = literalizedString.indexOf("}}");

    // loop so long as there is '{{ something }}' in the string
    while (indexOfOpeningBraces !== -1 && indexOfClosingBraces !== -1) {
      const contentsOfFirstPair = literalizedString.slice(
        indexOfOpeningBraces + 2,
        indexOfClosingBraces,
      );
      const trimmedContents = contentsOfFirstPair.trim();
      const stringToReplace = `$.cndi.prompts.responses.${key}`;

      if (trimmedContents === stringToReplace) {
        literalizedString = replaceRange(
          literalizedString,
          indexOfOpeningBraces,
          indexOfClosingBraces + 2,
          `${value}`,
        );
      }

      indexOfOpeningBraces = literalizedString.indexOf("{{");
      indexOfClosingBraces = literalizedString.indexOf("}}");
      literalizedString = literalizedString.replaceAll(
        stringToReplace,
        `${value}`,
      );
    }
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
    templateObject.env.extend_basic_env,
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

  const cndiConfigStringified = JSON.stringify(
    templateObject["cndi-config"],
  );

  const literalizedCndiConfig = literalizeTemplateValuesInString(
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

  for (const p of templateObject?.env?.entries || []) {
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
    nodeKind: templateObject.readme.extend_basic_readme,
    project_name: opt.project_name,
  });

  const templateReadmeText = templateObject.readme?.template
    ? literalizeTemplateValuesInString(
      cndiConfigPromptResponses,
      templateObject.readme.template,
    )
    : "";

  const readme = `${coreReadme}\n\n${templateReadmeText}`;

  return {
    cndiConfig,
    env,
    readme,
  };
}
