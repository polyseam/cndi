import { ccolors, Command, Input, path, Select, SEP } from "deps";

import {
  checkInitialized,
  emitExitEvent,
  getDeploymentTargetFromConfig,
  getPrettyJSONString,
  loadJSONC,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { CNDIConfig, EnvLines } from "src/types.ts";

import { overwriteAction } from "src/commands/overwrite.ts";

import { getCoreEnvLines } from "src/deployment-targets/shared.ts";

import useTemplate from "src/templates/useTemplate.ts";

import { createSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { createTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { createArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";

import getKnownTemplates from "src/templates/knownTemplates.ts";

import getEnvFileContents from "src/outputs/env.ts";
import getGitignoreContents from "src/outputs/gitignore.ts";
import vscodeSettings from "src/outputs/vscode-settings.ts";
import getCndiRunGitHubWorkflowYamlContents from "src/outputs/cndi-run-workflow.ts";
import getReadmeForProject from "src/outputs/readme.ts";

import validateConfig from "src/validate/cndiConfig.ts";

const initLabel = ccolors.faded("\nsrc/commands/init.ts:");

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
  .option("-d, --debug", "Create a cndi project in debug mode.", {
    hidden: true,
  })
  .action(async (options) => {
    const pathToConfig = options.file;
    let template: string | undefined = options.template;
    let cndiConfig: CNDIConfig;
    let env: EnvLines;
    let readme: string;
    let project_name = Deno.cwd().split(SEP).pop() || "my-cndi-project"; // default to the current working directory name
    // if 'template' and 'interactive' are both falsy we want to look for config at 'pathToConfig'
    const useCNDIConfigFile = !options.interactive && !template;

    if (useCNDIConfigFile) {
      console.log(`cndi init --file "${pathToConfig}"\n`);
      try {
        cndiConfig = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;

        // validate config
        await validateConfig(cndiConfig, pathToConfig);
        project_name = cndiConfig.project_name as string;
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          // if config is not found at 'pathToConfig' we want to throw an error
          console.error(
            initLabel,
            ccolors.error(
              `cndi-config file not found at ${
                ccolors.user_input(
                  `"${pathToConfig}"`,
                )
              }\n`,
            ),
          );

          // and suggest a solution
          console.log(
            "if you don't have a cndi-config file try",
            ccolors.prompt(
              "cndi init --interactive",
            ),
          );
          await emitExitEvent(400);
          Deno.exit(400);
        }
      }
    }

    if (options.template === "true") {
      console.error(
        initLabel,
        ccolors.error(`--template (-t) flag requires a value`),
      );
      await emitExitEvent(401);
      Deno.exit(401);
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
        [
          ccolors.warn(
            "it looks like you have already initialized a cndi project in this directory:",
          ),
          ccolors.user_input(options.output),
          ccolors.prompt("\n\noverwrite existing artifacts?"),
        ].join(" "),
      )
      : true;

    if (!shouldContinue) {
      console.log();
      Deno.exit(0); // this event isn't handled by telemetry, it's just not very interesting
    }

    const templateNamesList: string[] = getKnownTemplates().map((t) => t.name);

    if (options.interactive) {
      project_name = (await Input.prompt({
        message: ccolors.prompt("Please enter a name for your CNDI project:"),
        default: project_name,
      })) as string;
    }

    // GENERATE ENV VARS
    const sealedSecretsKeys = await createSealedSecretsKeys(options.output);
    const terraformStatePassphrase = createTerraformStatePassphrase();
    const argoUIAdminPassword = createArgoUIAdminPassword();

    //let baseTemplateName = options.template?.split("/")[1]; // eg. "airflow"

    if (options.interactive && !template) {
      template = await Select.prompt({
        message: ccolors.prompt("Pick a template"),
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
      const nodeKind = cndiConfig!.infrastructure.cndi.nodes[0].kind;
      readme = getReadmeForProject({
        project_name,
        nodeKind,
      });

      env = await getCoreEnvLines(
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
        ccolors.user_input(`"${readmePath}"`),
        ccolors.warn(`already exists, skipping generation`),
      );
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        await stageFile(
          "README.md",
          readme,
        );
      }
    }

    const inDebugEnv =
      Deno.env.get("CNDI_TELEMETRY")?.toLowerCase() === "debug";

    if (options?.debug || inDebugEnv) {
      env.push(
        { comment: "Telemetry Mode" },
        { value: { CNDI_TELEMETRY: "debug" } },
      );
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
