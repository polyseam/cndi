import { loadRemoteJSONC } from "src/utils.ts";
import { getCoreEnvObject } from "src/deployment-targets/shared.ts";
import {
  CNDIConfig,
  DeploymentTarget,
  EnvObject,
  SealedSecretsKeys,
} from "../types.ts";
import {
  Input,
  prompt,
  Secret,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import getReadmeForProject from "src/outputs/readme.ts";

type TemplatePromptTypeNames =
  | "Input"
  | "Secret"
  | "Comment";

type TemplatePromptTypes = typeof Input | typeof Secret | typeof Comment;

class Comment {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
  get comment() {
    return this.value;
  }
  prompt() {
    return this.value;
  }
}

function getPromptModuleForType(
  type: TemplatePromptTypeNames,
): TemplatePromptTypes {
  switch (type) {
    case "Input":
      return Input;
    case "Secret":
      return Secret;
    case "Comment":
      return Comment;
    default:
      throw new Error(`Unknown prompt type ${type}`);
  }
}

interface TemplatePrompt {
  name: string;
  message: string;
  type: TemplatePromptTypeNames;
}

interface Template {
  "cndi-config": {
    prompts: Array<TemplatePrompt>;
    template: CNDIConfig;
  };
  "env": {
    prompts?: Array<TemplatePrompt>;
    extend_basic_env: DeploymentTarget;
  };
  "readme": {
    prompts?: Array<TemplatePrompt>;
    extend_basic_readme: DeploymentTarget;
  };
}

interface TemplateResult {
  "cndiConfig": CNDIConfig;
  "env": EnvObject;
  "readme": string;
}

interface CNDIGeneratedValues {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIAdminPassword: string;
}

const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/templates-as-urls/src/templates/";

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
    console.log("Template location is not a URL, loading from cndi repo");
    templateUrl = new URL(
      `${templateLocation}.json`,
      POLYSEAM_TEMPLATE_DIRECTORY,
    );
  }
  const templateObject = await loadRemoteJSONC(
    templateUrl,
  ) as unknown as Template;

  const cndiConfigPromptDefinitions = templateObject["cndi-config"].prompts;

  const cndiConfigPrompts = cndiConfigPromptDefinitions.map(
    (promptDefinition) => {
      return {
        ...promptDefinition,
        type: getPromptModuleForType(promptDefinition.type),
      };
    },
  );

  // deno-lint-ignore no-explicit-any
  const cndiConfigValues = await prompt(cndiConfigPrompts as unknown as any);

  const cndiConfigStringified = JSON.stringify(
    templateObject["cndi-config"].template,
  );

  for (const [key, value] of Object.entries(cndiConfigValues)) {
    const stringToReplace = `$.cndi.prompts.${key}`;
    cndiConfigStringified.replaceAll(stringToReplace, `${value}`);
  }

  let cndiConfig;

  try {
    cndiConfig = JSON.parse(cndiConfigStringified);
    cndiConfig.project_name = opt.project_name;
  } catch {
    throw new Error("Invalid cndi-config.jsonc generated");
  }

  const basicEnvPrompts = await getCoreEnvObject(
    cndiGeneratedValues,
    templateObject.env.extend_basic_env,
    interactive,
  );

  const templateEnvPromptDefinitions = templateObject.env.prompts;

  const templateEnvPrompts = templateEnvPromptDefinitions?.map((prompt) => {
    return {
      ...prompt,
      type: getPromptModuleForType(prompt.type),
    };
  });

  const templateEnvValues = templateEnvPrompts // deno-lint-ignore no-explicit-any
    ? await prompt(templateEnvPrompts as unknown as any)
    : {};

  const env: EnvObject = {
    ...basicEnvPrompts,
    ...(templateEnvValues || {}),
  };

  const readme = await getReadmeForProject({
    deploymentTarget: templateObject.readme.extend_basic_readme,
    project_name: opt.project_name,
  });

  return {
    cndiConfig,
    env,
    readme,
  };
}
