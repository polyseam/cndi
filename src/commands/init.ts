import "https://deno.land/std@0.173.0/dotenv/load.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";

import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { SEP } from "https://deno.land/std@0.178.0/path/mod.ts";
import {
  checkInitialized,
  getDeploymentTargetFromConfig,
  getPrettyJSONString,
  loadJSONC,
  persistStagedFiles,
  stageFile,
} from "../utils.ts";
import { CNDIConfig, EnvObject } from "../types.ts";

import { overwriteAction } from "./overwrite.ts";

import { Select } from "https://deno.land/x/cliffy@v0.25.4/prompt/select.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

import { getCoreEnvObject } from "../deployment-targets/shared.ts";

import useTemplate from "src/templates/useTemplate.ts";

import { createSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";

import { createTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";

import { createArgoUIAdminPassword } from "../initialize/argoUIAdminPassword.ts";

import getKnownTemplates from "src/templates/knownTemplates.ts";

import getEnvFileContents from "../outputs/env.ts";
import getGitignoreContents from "../outputs/gitignore.ts";
import vscodeSettings from "../outputs/vscode-settings.ts";
import getCndiRunGitHubWorkflowYamlContents from "../outputs/cndi-run-workflow.ts";
import getReadmeForProject from "../outputs/readme.ts";

import validateConfig from "../validate/cndiConfig.ts";

const initLabel = colors.white("\ninit:");

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
    const pathToConfig = options.file;
    let template: string | undefined = options.template;
    let cndiConfig: CNDIConfig;
    let env: EnvObject;
    let readme: string;
    let project_name = Deno.cwd().split(SEP).pop() || "my-cndi-project"; // default to the current working directory name
    // if 'template' and 'interactive' are both falsy we want to look for config at 'pathToConfig'
    const useCNDIConfigFile = !options.interactive && !template;

    if (useCNDIConfigFile) {
      console.log(`cndi init --file "${pathToConfig}"\n`);
      try {
        cndiConfig = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;

        // validate config
        validateConfig(cndiConfig, pathToConfig);
        project_name = cndiConfig.project_name as string;
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
    }

    if (options.template === "true") {
      console.error(
        initLabel,
        colors.brightRed(`--template (-t) flag requires a value`),
      );
      Deno.exit(1);
    }

    if (options.interactive && !template) {
      console.log("cndi init --interactive\n");
    }

    if (options.interactive && template) {
      console.log(`cndi init --interactive --template ${template}\n`);
    }

    if (!options.interactive && template) {
      console.log(`cndi init --template ${template}\n`);
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

    const templateNamesList: string[] = getKnownTemplates().map((t) => t.name);

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

    //let baseTemplateName = options.template?.split("/")[1]; // eg. "airflow-tls"

    if (options.interactive && !template) {
      template = await Select.prompt({
        message: colors.cyan("Pick a template"),
        options: templateNamesList,
      });
    }

    const cndiGeneratedValues = {
      sealedSecretsKeys,
      terraformStatePassphrase,
      argoUIAdminPassword,
    };

    if (template) {
      const templateResult = await useTemplate(
        template!,
        {
          project_name,
          cndiGeneratedValues,
          interactive: !!options.interactive,
        },
      );
      cndiConfig = templateResult.cndiConfig;
      await stageFile(
        "cndi-config.jsonc",
        getPrettyJSONString(cndiConfig),
      );
      readme = templateResult.readme;
      env = templateResult.env;
    } else {
      readme = getReadmeForProject({
        project_name,
        deploymentTarget: getDeploymentTargetFromConfig(cndiConfig!),
      });

      env = await getCoreEnvObject(
        cndiGeneratedValues,
        getDeploymentTargetFromConfig(cndiConfig!),
        !!options.interactive,
      );
    }

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
          readme,
        );
      }
    }

    await stageFile(".env", getEnvFileContents(env));

    await stageFile(
      path.join(".vscode", "settings.json"),
      getPrettyJSONString(vscodeSettings),
    );

    await stageFile(
      path.join(".github", "workflows", "cndi-run.yaml"),
      getCndiRunGitHubWorkflowYamlContents(),
    );

    await stageFile(".gitignore", getGitignoreContents());

    if (template) {
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
