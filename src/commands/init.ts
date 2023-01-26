import { CNDIConfig, CNDIContext, NodeKind, EnvObject } from "../types.ts";

import { copy } from "https://deno.land/std@0.173.0/fs/copy.ts";

import {
  getPrettyJSONString,
  loadJSONC,
  persistStagedFiles,
  stageFile,
stageFileSync,
} from "../utils.ts";

import {
  brightRed,
  cyan,
  white,
  yellow,
} from "https://deno.land/std@0.173.0/fmt/colors.ts";

import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import overwriteWithFn from "./overwrite.ts";

import { Select } from "https://deno.land/x/cliffy@v0.25.4/prompt/select.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

import {
  availableDeploymentTargets,
  getCoreEnvObject,
} from "../deployment-targets/shared.ts";

import getReadmeForProject from "../doc/readme-for-project.ts";

import { createSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";

import { createTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";

import { createArgoUIAdminPassword } from "../initialize/argoUIAdminPassword.ts";

import availableTemplates from "../templates/available-templates.ts";

import { checkInitialized } from "../utils.ts";

import getEnvFileContents from "../outputs/env.ts";
import getGitignoreContents from "../outputs/gitignore.ts";
import vscodeSettings from "../outputs/vscode-settings.ts";

import { Template } from "../templates/Template.ts";
import { dirname } from "https://deno.land/std@0.173.0/path/mod.ts";

const initLabel = white("init:");

/**
 * COMMAND fn: cndi init
 * Initializes ./cndi directory with the specified config file
 * and initializes workflows in .github
 */
export default async function init(context: CNDIContext) {
  // context.template?:string is the template name the user chose with the --template or -t flag
  // template:Template is a different thing, it is the object that is associated with a selected template name
  // template:Template does not have a "kind" associated, it takes one as an argument in it's applicable methods

  const initializing = true;

  try {
    await Deno.mkdir(context.stagingDirectory, { recursive: true });
  } catch {
    // directory exists already
  }

  // kind comes in from one of 2 places
  // 1. if the user chooses a template, we use the first part of the template name, eg. "aws" or "gcp"
  // 2. if the user brings their own config file, we read it from the first NodeItemSpec in the config file
  let kind: NodeKind | undefined;

  let project_name = Deno.cwd().split("/").pop() || "my-cndi-project";

  // if 'template' and 'interactive' are both falsy we want to look for config at 'pathToConfig'
  const useCNDIConfigFile = !context.interactive && !context.template;

  if (useCNDIConfigFile) {
    try {
      console.log(`cndi init --file "${context.pathToConfig}"\n`);
      const config = (await loadJSONC(
        context.pathToConfig
      )) as unknown as CNDIConfig;

      if (!config?.project_name) {
        console.log(
          brightRed(
            `cndi-config file found was at ${white(
              `"${context.pathToConfig}"`
            )} but it does not have the required ${cyan(
              '"project_name"'
            )} key\n`
          )
        );
        Deno.exit(1);
      }

      if (!config.infrastructure) {
        console.log(
          initLabel,
          brightRed(
            `cndi-config file found was at ${white(
              `"${context.pathToConfig}"`
            )} but it does not have the required ${cyan(
              '"infrastructure"'
            )} key\n`
          )
        );

        // TODO: remove this warning, there are at most only a few people using the old syntax
        const badconfig = config as unknown as Record<string, unknown>;

        if (badconfig?.nodes) {
          console.log(
            initLabel,
            yellow(
              `You appear to be using the deprecated pre-release config syntax. Sorry!`
            )
          );
          console.log(
            initLabel,
            "please read more about the 1.x.x syntax at",
            cyan("https://github.com/polyseam/cndi#infrastructure-and-nodes\n")
          );
        }

        Deno.exit(1);
      } else if (!config.infrastructure.cndi.nodes[0]) {
        console.log(
          initLabel,
          brightRed(
            `cndi-config file found was at ${white(
              `"${context.pathToConfig}"`
            )} but it does not have any ${cyan(
              '"cndi.infrastructure.nodes"'
            )} entries\n`
          )
        );
      }

      if (!config.cndi_version) {
        console.log(
          initLabel,
          yellow(
            `You haven't specified a ${cyan(
              '"cndi_version"'
            )} in your config file, defaulting to "v1"\n`
          )
        );
      }

      // 1. the user brought their own config file, we use the kind of the first node
      kind = config.infrastructure.cndi.nodes[0].kind as NodeKind; // only works when all nodes are the same kind
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        // if config is not found at 'pathToConfig' we want to throw an error
        console.log(
          initLabel,
          brightRed(
            `cndi-config file not found at ${white(
              `"${context.pathToConfig}"`
            )}\n`
          )
        );

        // and suggest a solution
        console.log(
          `if you don't have a cndi-config file try ${cyan(
            "cndi init --interactive"
          )}\n`
        );
        Deno.exit(1);
      }
    }
  } else if (context.interactive) {
    if (context.template) {
      if (`${context.template}` === "true") {
        console.log(`cndi init --interactive --template\n`);
        console.error(
          initLabel,
          brightRed(`--template (-t) flag requires a value`)
        );
        Deno.exit(1);
      }
      // 2a. the user used a template name, we pull the 'kind' out of it
      kind = context.template?.split("/")[0] as NodeKind;
      console.log(`cndi init --interactive --template ${context.template}\n`);
    } else {
      // we don't know the kind so we need to get it when the user chooses a template (see 2c)
      console.log("cndi init --interactive\n");
    }
  } else {
    // if the user passes -t or --template with no value, we raise an error
    if (`${context.template}` === "true") {
      // if template flag is truthy but empty, throw error
      console.log(`cndi init --template\n`);
      console.error(
        initLabel,
        brightRed(`--template (-t) flag requires a value`)
      );
      Deno.exit(1);
    }

    console.log(`cndi init --template ${context.template}\n`);
    // 2b. the user has passed a template name, we pull the 'deploymentTarget' out of it then select the default kind for that platform
    // eg. aws -> aws
    kind = context.template?.split("/")[0] as NodeKind;
  }

  const directoryContainsCNDIFiles = await checkInitialized(context);

  const shouldContinue = directoryContainsCNDIFiles
    ? confirm(
        "It looks like you have already initialized a cndi project in this directory. Overwrite existing artifacts?"
      )
    : true;

  if (!shouldContinue) {
    Deno.exit(0);
  }

  const templateNamesList: string[] = [];

  availableTemplates.forEach((tpl) => {
    availableDeploymentTargets.forEach((kind: NodeKind) => {
      templateNamesList.push(`${kind}/${tpl.name}`);
    });
  });

  if (context.template) {
    const templateUnavailable = !templateNamesList.includes(context.template);

    if (templateUnavailable) {
      console.log(
        initLabel,
        brightRed(
          `The template you selected "${context.template}" is not available.\n`
        )
      );

      console.log("Available templates are:\n");
      console.log(`${templateNamesList.map((t) => cyan(t)).join(", ")}\n`);
      Deno.exit(1);
    }
  }

  if (context.interactive) {
    project_name = (await Input.prompt({
      message: cyan("Please enter a name for your CNDI project:"),
      default: project_name,
    })) as string;
  }

  // GENERATE ENV VARS
  const sealedSecretsKeys = await createSealedSecretsKeys(context);
  const terraformStatePassphrase = createTerraformStatePassphrase();
  const argoUIAdminPassword = createArgoUIAdminPassword();

  const { CNDI_SRC, interactive, projectDirectory } = context;

  let baseTemplateName = context.template?.split("/")[1]; // eg. "airflow-tls"

  if (interactive && !context.template) {
    const selectedTemplate = await Select.prompt({
      message: cyan("Pick a template"),
      options: templateNamesList,
    });
    // 2c. the user finally selected a template, we pull the 'kind' out of it
    kind = selectedTemplate.split("/")[0] as NodeKind;
    baseTemplateName = selectedTemplate.split("/")[1]; // eg. "airflow-tls"
  }

  if (!kind) {
    console.log(initLabel, brightRed(`"kind" cannot be inferred`));
    Deno.exit(1);
  }

  const template: Template = availableTemplates.find(
    (t) => t.name === baseTemplateName
  ) as Template; // we know this exists because we checked it above

  const coreEnvObject = await getCoreEnvObject(
    { sealedSecretsKeys, terraformStatePassphrase, argoUIAdminPassword },
    kind, // aws | gcp | azure
    context.interactive
  );

  const templateEnvObject = template
    ? await template.getEnv(context.interactive)
    : {};

  const envObject = {
    ...coreEnvObject,
    ...templateEnvObject,
  };

  const cndiContextWithGeneratedValues = {
    ...context,
    sealedSecretsKeys,
    terraformStatePassphrase,
    argoUIAdminPassword,
  };

  await stageFile(
    context.stagingDirectory,
    path.join(".vscode", "settings.json"),
    getPrettyJSONString(vscodeSettings)
  );

  if (!context.noGitHub) {
    try {
      const workflowContents = await Deno.readTextFile(
        path.join(CNDI_SRC, "github", "workflows", "cndi-run.yaml")
      );

      const targetGithubDirectory = path.join(
        ".github",
        "workflows",
        "cndi-run.yaml"
      );

      await stageFile(
        context.stagingDirectory,
        targetGithubDirectory,
        workflowContents
      );
    } catch (githubCopyError) {
      console.log(
        initLabel,
        brightRed("failed to copy github integration files")
      );
      console.error(githubCopyError);
      Deno.exit(1);
    }
  }

  // write a readme, extend via Template.readmeBlock if it exists

  const readmePath = path.join(projectDirectory, "README.md");

  try {
    await Deno.stat(readmePath);
    console.log(
      initLabel,
      yellow(`"${readmePath}" already exists, skipping generation`)
    );
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      await stageFile(
        context.stagingDirectory,
        "README.md",
        template?.getReadmeString({ project_name, kind }) ||
          getReadmeForProject({ project_name, kind })
      );
    }
  }

  await stageFile(
    context.stagingDirectory,
    ".gitignore",
    getGitignoreContents()
  );
  
  // .env is processed by OW so we need to write it to disk immediately
  await stageFile(
    context.stagingDirectory,
    ".env",
    getEnvFileContents(envObject)
  );

  // if the user has specified a template, use that
  if (template) {
    const pathToConfig = path.join(projectDirectory, 'cndi-config.jsonc');
    const conf = await template.getConfiguration(context.interactive);
    const templateString = template.getTemplate(kind, conf, project_name);

    await stageFile(
      context.stagingDirectory,
      'cndi-config.jsonc',
      templateString
    );

    const finalContext = {
      ...cndiContextWithGeneratedValues,
      pathToConfig,
    };

    await persistStagedFiles(context.stagingDirectory, projectDirectory)

    // because there is no "pathToConfig" when using a template, we need to set it here
    overwriteWithFn(finalContext, initializing);
    return;
  }
  await persistStagedFiles(context.stagingDirectory, projectDirectory)
  overwriteWithFn(cndiContextWithGeneratedValues, initializing);
}
