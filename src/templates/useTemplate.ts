import { emitExitEvent, getPrettyJSONString, replaceRange } from "src/utils.ts";
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
  JSONC,
  List,
  Number,
  prompt,
  Secret,
  Select,
  Toggle,
  YAML,
} from "deps";

import getReadmeForProject from "src/outputs/readme.ts";
import { POLYSEAM_TEMPLATE_DIRECTORY } from "src/templates/knownTemplates.ts";

const useTemplateLabel = ccolors.faded("\nsrc/templates/useTemplate.ts:");

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

function getPromptModuleForType(type: TemplatePromptTypeNames) {
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
    env: {
      entries?: Array<TemplateEnvCommentEntry | TemplateEnvValueEntry>;
      extend_basic_env: DeploymentTarget;
    };
    readme: {
      extend_basic_readme: DeploymentTarget;
      template_section?: string;
    };
  };
}

interface TemplateResult {
  cndiConfig: CNDIConfig;
  env: EnvLines;
  readme: string;
}

interface CNDIGeneratedValues {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIAdminPassword: string;
}

interface CndiConfigPromptResponses {
  [key: string]: string | number | boolean | Array<unknown>;
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
    indexOfOpeningBraces !== -1 &&
    indexOfClosingBraces !== -1 &&
    literalizedString.indexOf("$.cndi.prompts.responses.") <
      indexOfClosingBraces &&
    literalizedString.indexOf("$.cndi.prompts.responses.") >
      indexOfOpeningBraces
  ) {
    const contentsOfFirstPair = literalizedString.substring(
      indexOfOpeningBraces + 2,
      indexOfClosingBraces,
    );

    const trimmedContents = contentsOfFirstPair.trim();
    const [_, key] = trimmedContents.split("$.cndi.prompts.responses.");
    const valueToSubstitute = cndiConfigPromptResponses[key];

    if (key) {
      if (typeof valueToSubstitute === "string") {
        const indexOfClosingBracesInclusive = indexOfClosingBraces + 2;
        literalizedString = replaceRange(
          literalizedString,
          indexOfOpeningBraces,
          indexOfClosingBracesInclusive,
          valueToSubstitute,
        );
      } else {
        const indexOfOpenWrappingQuote = indexOfOpeningBraces - 1;
        const indexOfClosingWrappingQuoteInclusive = indexOfClosingBraces + 3;
        literalizedString = replaceRange(
          literalizedString,
          indexOfOpenWrappingQuote,
          indexOfClosingWrappingQuoteInclusive,
          JSON.stringify(valueToSubstitute),
        );
      }
    }
    indexOfOpeningBraces = literalizedString.indexOf("{{");
    indexOfClosingBraces = literalizedString.indexOf("}}");
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
    const validTargets = [
      { name: "aws", aliasFor: "ec2" },
      { name: "ec2" },
      { name: "eks" },
      { name: "azure" },
      { name: "gcp" },
      { name: "dev" },
    ];

    const validTarget = validTargets.find((target) => {
      return templateLocation.startsWith(target.name);
    });

    if (!validTarget) {
      const numberOfSlashes = templateLocation.split("/").length - 1;

      // it's not a valid template target
      console.error(
        useTemplateLabel,
        ccolors.user_input(`"${templateLocation}"`),
        ccolors.error("is not a valid template name"),
      );

      if (numberOfSlashes > 1) {
        console.log(
          useTemplateLabel,
          ccolors.warn("Were you trying to use a local template file?"),
          ccolors.warn("Try using the"),
          ccolors.key_name("file://"),
          ccolors.warn("prefix with an absolute file path to the template."),
        );
        console.log();
      }

      await emitExitEvent(1200);
      Deno.exit(1200);
    } else if (validTarget?.aliasFor) {
      templateLocation = templateLocation.replace(
        validTarget.name,
        validTarget.aliasFor,
      );
    }
    templateUrl = new URL(
      // use YAML templates by default now
      `${templateLocation}.yaml`,
      POLYSEAM_TEMPLATE_DIRECTORY,
    );
  }

  let templateObject: Template;
  let templateText: string;
  let response: Response;

  const templateFormatIsYAML: boolean =
    templateUrl.pathname.endsWith(".yaml") ||
    templateUrl.pathname.endsWith(".yml");

  try {
    response = await fetch(templateUrl);
    templateText = await response.text();
  } catch (fetchError) {
    console.error(
      useTemplateLabel,
      ccolors.error("could not fetch template from"),
      ccolors.user_input(`"${templateUrl}"`),
    );
    console.log(ccolors.caught(fetchError, 1201));
    if (templateUrl.protocol === "file:") {
      console.log(
        useTemplateLabel,
        ccolors.user_input(templateLocation),
        ccolors.warn(
          "is not a valid file URL. Please ensure you are using an absolute path to the template file.",
        ),
      );
    }
    await emitExitEvent(1201);
    Deno.exit(1201);
  }

  try {
    templateObject = templateFormatIsYAML
      ? (YAML.parse(templateText) as unknown as Template)
      : (JSONC.parse(templateText) as unknown as Template);
  } catch (parseError) {
    console.error(
      useTemplateLabel,
      ccolors.user_input(`"${templateUrl}"`),
      ccolors.error("did not contain valid JSONC for Template"),
    );
    console.log(ccolors.caught(parseError, 1202));
    await emitExitEvent(1202);
    Deno.exit(1202);
  }

  const coreEnvLines = await getCoreEnvLines(
    cndiGeneratedValues,
    templateObject.outputs.env.extend_basic_env,
    interactive,
  );

  const cndiConfigPromptDefinitions = templateObject.prompts || [];

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
  const cndiConfigStringified = templateFormatIsYAML
    ? getPrettyJSONString(templateObject.outputs["cndi-config"])
    : YAML.stringify(
      templateObject.outputs["cndi-config"] as unknown as Record<
        string,
        unknown
      >,
    );

  const literalizedCndiConfig = await literalizeTemplateValuesInString(
    cndiConfigPromptResponses,
    cndiConfigStringified,
  );

  let cndiConfig;

  try {
    const cndiConfigData = templateFormatIsYAML
      ? YAML.parse(literalizedCndiConfig)
      : JSON.parse(literalizedCndiConfig);

    cndiConfig = {
      project_name: opt.project_name,
      ...cndiConfigData,
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

      templateEnvLines.push({ value: { [p.name]: value } } as EnvValueEntry);
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
