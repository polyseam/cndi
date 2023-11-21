import { ccolors, Command, path, PromptTypes, SEP, YAML } from "deps";
import type { SealedSecretsKeys } from "src/types.ts";

const { Input, Select } = PromptTypes;

import {
  checkInitialized,
  emitExitEvent,
  getPrettyJSONString,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { overwriteAction } from "src/commands/overwrite.ts";

import {
  CNDITemplatePromptResponsePrimitive,
  getKnownTemplates,
  useTemplate,
} from "src/templates/templates.ts";

import { createSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { createTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { createArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";

import getGitignoreContents from "src/outputs/gitignore.ts";
import vscodeSettings from "src/outputs/vscode-settings.ts";
import getCndiRunGitHubWorkflowYamlContents from "src/outputs/cndi-run-workflow.ts";

const initLabel = ccolors.faded("\nsrc/commands/init.ts:");

const defaultResponsesFilePath = path.join(Deno.cwd(), "responses.yaml");

function getFinalEnvString(
  templatePartial = "",
  cndiGeneratedValues: {
    sealedSecretsKeys: SealedSecretsKeys;
    terraformStatePassphrase: string;
    argoUIAdminPassword: string;
    debugMode: boolean;
  },
) {
  const { sealedSecretsKeys, terraformStatePassphrase, argoUIAdminPassword } =
    cndiGeneratedValues;

  let telemetryMode = "";

  if (cndiGeneratedValues.debugMode) {
    telemetryMode = "\n\n# Telemetry Mode\nCNDI_TELEMETRY=debug";
  }

  return `
# Sealed Secrets Keys
SEALED_SECRETS_PRIVATE_KEY='${sealedSecretsKeys.sealed_secrets_private_key}'
SEALED_SECRETS_PUBLIC_KEY='${sealedSecretsKeys.sealed_secrets_public_key}'

# Terraform State Passphrase
TERRAFORM_STATE_PASSPHRASE=${terraformStatePassphrase}

# Argo UI Admin Password
ARGO_UI_ADMIN_PASSWORD=${argoUIAdminPassword}${telemetryMode}
${templatePartial}`.trim();
}

/**
 * COMMAND cndi init
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const initCommand = new Command()
  .description(`Initialize new cndi project.`)
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
  .option(
    "-r, --responses-file <responses_file:string>",
    "A path to a set of responses to supply to your template",
    {
      default: defaultResponsesFilePath,
    },
  )
  .option(
    `-s, --set <set>`,
    `Override a response, usage: --set responseName=responseValue`,
    {
      collect: true,
      equalsSign: true,
    },
  )
  .option(
    "-w, --workflow-ref <ref:string>",
    "Specify a ref to build a cndi workflow with",
    {
      hidden: true,
    },
  )
  .option(
    "-l, --deployment-target-label <deployment_target_label:string>",
    "Specify a deployment target",
  )
  .option("-k, --keep", "Keep responses in response.yaml")
  .action(async (options) => {
    let template: string | undefined = options.template;
    let overrides: Record<string, CNDITemplatePromptResponsePrimitive> = {};

    if (!template && !options.interactive) {
      console.log("cndi init\n");
      console.error(
        initLabel,
        ccolors.error(
          `--interactive (-i) flag is required if no template is specified`,
        ),
      );
      await emitExitEvent(400);
      Deno.exit(400);
    }

    if (options.responsesFile === defaultResponsesFilePath) {
      // attempting to load responses file from CWD, if it doesn't exist that's fine
      try {
        const responseFileText = Deno.readTextFileSync(options.responsesFile);
        const responses = YAML.parse(responseFileText);
        if (responses) {
          overrides = responses as Record<
            string,
            CNDITemplatePromptResponsePrimitive
          >;
        }
      } catch (_errorReadingResponsesFile) {
        // we're not worried if the file isn't found if the user didn't specify a path
      }
    } else {
      // attempting to load responses file from user specified path
      let responseFileText = "";

      try {
        responseFileText = Deno.readTextFileSync(options.responsesFile);
      } catch (errorReadingSuppliedResponseFile) {
        console.log(ccolors.caught(errorReadingSuppliedResponseFile, 2000));

        console.error(
          initLabel,
          ccolors.error(`Could not load responses file from provided path`),
          ccolors.key_name(`"${options.responsesFile}"`),
        );

        await emitExitEvent(2000);
        Deno.exit(2000);
      }

      try {
        const responses = YAML.parse(responseFileText);
        if (responses) {
          overrides = responses as Record<
            string,
            CNDITemplatePromptResponsePrimitive
          >;
        }
      } catch (errorParsingResponsesFile) {
        console.log(ccolors.caught(errorParsingResponsesFile, 2001));

        console.error(
          initLabel,
          ccolors.error(
            `Could not parse file as responses YAML from provide path`,
          ),
          ccolors.key_name(`"${options.responsesFile}"`),
        );
        await emitExitEvent(2001);
        Deno.exit(2001);
      }
    }

    if (options.set) {
      for (const set of options.set) {
        const [key, value] = set.split("=");
        overrides[key] = value;
      }
    }

    let cndi_config: string;
    let env: string;
    let readme: string;
    let project_name = Deno.cwd().split(SEP).pop() || "my-cndi-project"; // default to the current working directory name

    if (options.template === "true") {
      console.error(
        initLabel,
        ccolors.error(`--template (-t) flag requires a value`),
      );
      await emitExitEvent(400);
      Deno.exit(400);
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

    if (options.deploymentTargetLabel) {
      const [deployment_target_provider, deployment_target_distribution] =
        options.deploymentTargetLabel.split("/");
      if (!deployment_target_distribution) {
        console.error(
          initLabel,
          ccolors.error(
            `--deployment-target (-dt) flag requires a value in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(490);
        Deno.exit(490);
      }
      if (!deployment_target_provider) {
        console.error(
          initLabel,
          ccolors.error(
            `--deployment-target (-dt) flag requires a value in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(491);
        Deno.exit(491);
      }
      overrides.deployment_target_provider = deployment_target_provider;
      overrides.deployment_target_distribution = deployment_target_distribution;
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

    if (options.interactive && !template) {
      template = await Select.prompt({
        message: ccolors.prompt("Pick a template"),
        search: true,
        options: templateNamesList,
      });
    }

    const cndiGeneratedValues = {
      sealedSecretsKeys,
      terraformStatePassphrase,
      argoUIAdminPassword,
      debugMode: !!options.debug,
    };

    if (template) {
      const templateResult = await useTemplate(
        template!,
        !!options.interactive,
        { project_name, ...overrides },
      );
      cndi_config = templateResult.cndi_config;
      await stageFile("cndi_config.yaml", cndi_config);
      readme = templateResult.readme;
      env = templateResult.env;
      if (options.keep) {
        await stageFile(
          "responses.yaml",
          YAML.stringify(templateResult.responses),
        );
      }
    } else {
      // uhh not sure bout dis
      readme = `# ${project_name}\n`;
      env = "";
    }

    await stageFile(".env", getFinalEnvString(env, cndiGeneratedValues));

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
        await stageFile("README.md", readme);
      }
    }

    await stageFile(
      path.join(".vscode", "settings.json"),
      getPrettyJSONString(vscodeSettings),
    );

    await stageFile(
      path.join(".github", "workflows", "cndi-run.yaml"),
      getCndiRunGitHubWorkflowYamlContents(options?.workflowRef),
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
