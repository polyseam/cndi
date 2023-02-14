import "https://deno.land/std@0.173.0/dotenv/load.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";

import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

import {
  checkInitialized,
  checkInstalled,
  ensureInstalled,
  getPrettyJSONString,
  loadJSONC,
  persistStagedFiles,
  stageFile,
} from "../utils.ts";
import { CNDIConfig, NodeKind } from "../types.ts";

import { overwriteAction } from "./overwrite.ts";

import { Select } from "https://deno.land/x/cliffy@v0.25.4/prompt/select.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

import {
  availableDeploymentTargets,
  getCoreEnvObject,
} from "../deployment-targets/shared.ts";

import { createSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";

import { createTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";

import { createArgoUIAdminPassword } from "../initialize/argoUIAdminPassword.ts";

import availableTemplates from "../templates/available-templates.ts";

import getEnvFileContents from "../outputs/env.ts";
import getGitignoreContents from "../outputs/gitignore.ts";
import vscodeSettings from "../outputs/vscode-settings.ts";
import getCndiRunGitHubWorkflowYamlContents from "../outputs/cndi-run-workflow.ts";
import getReadmeForProject from "../outputs/readme.ts";

import { Template } from "../templates/Template.ts";

const initLabel = colors.white("init:");

/**
 * COMMAND cndi init
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const initCommand = new Command()
  .description(`Initialize new cndi project.`)
  .option("-f, --file <file:string>", "Path to your cndi-config.jsonc file.", {
    default: path.join(Deno.cwd(), "cndi-config.jsonc"),
  })
  .option(
    "-o, --output, --project, -p <output:string>",
    "Destination for new cndi project files.",
    { default: Deno.cwd() },
  )
  .option("-i, --interactive", "Run in interactive mode.")
  .option("-t, --template <template:string>", "CNDI Template to use.")
  .action(async (options) => {
    console.log();

    await ensureInstalled();

    const pathToConfig = options.file;

    // kind comes in from one of 2 places
    // 1. if the user chooses a template, we use the first part of the template name, eg. "aws" or "gcp"
    // 2. if the user brings their own config file, we read it from the first NodeItemSpec in the config file
    let kind: NodeKind | undefined;
    let project_name = Deno.cwd().split("/").pop() || "my-cndi-project";

    // if 'template' and 'interactive' are both falsy we want to look for config at 'pathToConfig'
    const useCNDIConfigFile = !options.interactive && !options.template;

    if (useCNDIConfigFile) {
      try {
        console.log(`cndi init --file "${pathToConfig}"\n`);
        const config = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;

        if (!config?.project_name) {
          console.log(
            colors.brightRed(
              `cndi-config file found was at ${
                colors.white(
                  `"${pathToConfig}"`,
                )
              } but it does not have the required ${
                colors.cyan(
                  '"project_name"',
                )
              } key\n`,
            ),
          );
          Deno.exit(1);
        }

        if (!config.infrastructure) {
          console.log(
            initLabel,
            colors.brightRed(
              `cndi-config file found was at ${
                colors.white(
                  `"${pathToConfig}"`,
                )
              } but it does not have the required ${
                colors.cyan(
                  '"infrastructure"',
                )
              } key\n`,
            ),
          );

          // TODO: remove this warning, there are at most only a few people using the old syntax
          const badconfig = config as unknown as Record<string, unknown>;

          if (badconfig?.nodes) {
            console.log(
              initLabel,
              colors.yellow(
                `You appear to be using the deprecated pre-release config syntax. Sorry!`,
              ),
            );
            console.log(
              initLabel,
              "please read more about the 1.x.x syntax at",
              colors.cyan(
                "https://github.com/polyseam/cndi#infrastructure-and-nodes\n",
              ),
            );
          }

          Deno.exit(1);
        } else if (!config.infrastructure.cndi.nodes[0]) {
          console.log(
            initLabel,
            colors.brightRed(
              `cndi-config file found was at ${
                colors.white(
                  `"${pathToConfig}"`,
                )
              } but it does not have any ${
                colors.cyan(
                  '"cndi.infrastructure.nodes"',
                )
              } entries\n`,
            ),
          );
        }

        if (!config.cndi_version) {
          console.log(
            initLabel,
            colors.yellow(
              `You haven't specified a ${
                colors.cyan(
                  '"cndi_version"',
                )
              } in your config file, defaulting to "v1"\n`,
            ),
          );
        }

        // 1. the user brought their own config file, we use the kind of the first node
        kind = config.infrastructure.cndi.nodes[0].kind as NodeKind; // only works when all nodes are the same kind
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          // if config is not found at 'pathToConfig' we want to throw an error
          console.log(
            initLabel,
            colors.brightRed(
              `cndi-config file not found at ${
                colors.white(
                  `"${pathToConfig}"`,
                )
              }\n`,
            ),
          );

          // and suggest a solution
          console.log(
            `if you don't have a cndi-config file try ${
              colors.cyan(
                "cndi init --interactive",
              )
            }\n`,
          );
          Deno.exit(1);
        }
      }
    } else if (options.interactive) {
      if (options.template) {
        if (`${options.template}` === "true") {
          console.log(`cndi init --interactive --template\n`);
          console.error(
            initLabel,
            colors.brightRed(`--template (-t) flag requires a value`),
          );
          Deno.exit(1);
        }
        // 2a. the user used a template name, we pull the 'kind' out of it
        kind = options.template?.split("/")[0] as NodeKind;
        console.log(`cndi init --interactive --template ${options.template}\n`);
      } else {
        // we don't know the kind so we need to get it when the user chooses a template (see 2c)
        console.log("cndi init --interactive\n");
      }
    } else {
      // if the user passes -t or --template with no value, we raise an error
      if (`${options.template}` === "true") {
        // if template flag is truthy but empty, throw error
        console.log(`cndi init --template\n`);
        console.error(
          initLabel,
          colors.brightRed(`--template (-t) flag requires a value`),
        );
        Deno.exit(1);
      }

      console.log(`cndi init --template ${options.template}\n`);
      // 2b. the user has passed a template name, we pull the 'deploymentTarget' out of it then select the default kind for that platform
      // eg. aws -> aws
      kind = options.template?.split("/")[0] as NodeKind;
    }

    const directoryContainsCNDIFiles = await checkInitialized(options.output);

    const shouldContinue = directoryContainsCNDIFiles
      ? confirm(
        "It looks like you have already initialized a cndi project in this directory. Overwrite existing artifacts?",
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

    if (options.template) {
      const templateUnavailable = !templateNamesList.includes(options.template);

      if (templateUnavailable) {
        console.log(
          initLabel,
          colors.brightRed(
            `The template you selected "${options.template}" is not available.\n`,
          ),
        );

        console.log("Available templates are:\n");
        console.log(
          `${templateNamesList.map((t) => colors.cyan(t)).join(", ")}\n`,
        );
        Deno.exit(1);
      }
    }

    if (options.interactive) {
      project_name = (await Input.prompt({
        message: colors.cyan("Please enter a name for your CNDI project:"),
        default: project_name,
      })) as string;
    }

    // GENERATE ENV VARS
    const sealedSecretsKeys = await createSealedSecretsKeys(options.output);
    const terraformStatePassphrase = createTerraformStatePassphrase();
    const argoUIAdminPassword = createArgoUIAdminPassword();

    let baseTemplateName = options.template?.split("/")[1]; // eg. "airflow-tls"

    if (options.interactive && !options.template) {
      const selectedTemplate = await Select.prompt({
        message: colors.cyan("Pick a template"),
        options: templateNamesList,
      });
      // 2c. the user finally selected a template, we pull the 'kind' out of it
      kind = selectedTemplate.split("/")[0] as NodeKind;
      baseTemplateName = selectedTemplate.split("/")[1]; // eg. "airflow-tls"
    }

    if (!kind) {
      console.log(initLabel, colors.brightRed(`"kind" cannot be inferred`));
      Deno.exit(1);
    }

    const template: Template = availableTemplates.find(
      (t) => t.name === baseTemplateName,
    ) as Template; // we know this exists because we checked it above

    const coreEnvObject = await getCoreEnvObject(
      { sealedSecretsKeys, terraformStatePassphrase, argoUIAdminPassword },
      kind, // aws | gcp | azure
      !!options.interactive,
    );

    const templateEnvObject = template
      ? await template.getEnv(!!options.interactive)
      : {};

    const envObject = {
      ...coreEnvObject,
      ...templateEnvObject,
    };

    await stageFile(
      path.join(".vscode", "settings.json"),
      getPrettyJSONString(vscodeSettings),
    );

    // write a readme, extend via Template.readmeBlock if it exists

    const readmePath = path.join(options.output, "README.md");

    try {
      await Deno.stat(readmePath);
      console.log(
        initLabel,
        colors.yellow(`"${readmePath}" already exists, skipping generation`),
      );
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        await stageFile(
          "README.md",
          template?.getReadmeString({ project_name, kind }) ||
            getReadmeForProject({ project_name, kind }),
        );
      }
    }

    await stageFile(
      path.join(".github", "workflows", "cndi-run.yaml"),
      getCndiRunGitHubWorkflowYamlContents(),
    );

    await stageFile(".gitignore", getGitignoreContents());

    // .env is processed by OW so we need to write it to disk immediately
    await stageFile(".env", getEnvFileContents(envObject));

    // if the user has specified a template, use that
    if (template) {
      const conf = await template.getConfiguration(!!options.interactive);
      const templateString = template.getTemplate(kind, conf, project_name);

      await stageFile("cndi-config.jsonc", templateString);

      await persistStagedFiles(options.output);

      // because there is no "pathToConfig" when using a template, we need to set it here
      await overwriteAction({
        output: options.output,
        initializing: true,
      });
      return;
    }
    await persistStagedFiles(options.output);
    await overwriteAction({ output: options.output, initializing: true });
  });

export default initCommand;
