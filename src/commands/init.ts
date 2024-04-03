import { ccolors, Command, path, PromptTypes, SEPARATOR, YAML } from "deps";

const { Input, Select } = PromptTypes;

import {
  checkForRequiredMissingCreateRepoValues,
  checkInitialized,
  emitExitEvent,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { useTemplate } from "src/use-template/mod.ts";

import type { CNDITemplatePromptResponsePrimitive } from "src/use-template/types.ts";

import { KNOWN_TEMPLATES } from "consts";

import { owAction } from "src/commands/overwrite.ts";

import { createSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { createSshKeys } from "src/initialize/sshKeys.ts";
import { createTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { createArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";

import getGitignoreContents from "src/outputs/gitignore.ts";
import vscodeSettings from "src/outputs/vscode-settings.ts";
import getCndiRunGitHubWorkflowYamlContents from "src/outputs/cndi-run-workflow.ts";
import getFinalEnvString from "src/outputs/dotenv.ts";

const initLabel = ccolors.faded("\nsrc/commands/init.ts:");

const defaultResponsesFilePath = path.join(Deno.cwd(), "cndi_responses.yaml");

type EchoInitOptions = {
  interactive?: boolean;
  template?: string;
  output?: string;
  deploymentTargetLabel?: string;
  keep?: boolean;
  create?: boolean;
};

const echoInit = (options: EchoInitOptions) => {
  const cndiInit = "cndi init";
  const cndiInitCreate = options.create ? " --create" : "";
  const cndiInitInteractive = options.interactive ? " --interactive" : "";
  const cndiInitTemplate = options.template
    ? ` --template ${options.template}`
    : "";

  const cndiInitOutput = options.output === Deno.cwd()
    ? ""
    : ` --output ${options.output}`;

  const deploymentTargetLabel = options.deploymentTargetLabel
    ? ` --deployment-target-label ${options.deploymentTargetLabel}`
    : "";
  console.log(
    `${cndiInit}${cndiInitCreate}${cndiInitInteractive}${cndiInitTemplate}${deploymentTargetLabel}${cndiInitOutput}\n`,
  );
};

/**
 * COMMAND cndi init
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const initCommand = new Command()
  .description(`Initialize new cndi project.`)
  .option(
    "-o, --output, --project, -p [output:string]",
    "Destination for new cndi project files.",
    getProjectDirectoryFromFlag,
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
    "--deployment-target-label, -l <deployment_target_label:string>",
    "Label in the form of <provider/distribution> slug to specifying a deployment target",
  )
  .option("-k, --keep", "Keep responses in cndi_responses.yaml")
  .option(
    "-c, --create",
    "Create a new cndi cluster repo",
  )
  .action(async (options) => {
    // default to the current working directory if -o, --output is ommitted
    const destinationDirectory = options.output ?? Deno.cwd();

    echoInit({ ...options, output: destinationDirectory });

    let template: string | undefined = options.template;
    let overrides: Record<string, CNDITemplatePromptResponsePrimitive> = {};

    if (!template && !options.interactive) {
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
    let project_name = destinationDirectory.split(SEPARATOR).pop() ||
      "my-cndi-project"; // default to the current working directory name

    if (options.template === "true") {
      console.error(
        initLabel,
        ccolors.error(`--template (-t) flag requires a value`),
      );
      await emitExitEvent(400);
      Deno.exit(400);
    }

    const noProvider = !options.interactive &&
      !options.deploymentTargetLabel && !overrides.deployment_target_provider;

    if (noProvider) {
      console.error(
        initLabel,
        ccolors.key_name("deployment_target_provider"),
        ccolors.error(
          `is required when not running in`,
        ),
        ccolors.key_name("--interactive"),
        ccolors.error(`mode`),
      );
      console.error(
        initLabel,
        ccolors.error("you can set this value using"),
        ccolors.key_name(
          "--deployment-target-label (-l) <provider>/<distribution>",
        ),
        ccolors.error("or"),
      );
      console.error(
        initLabel,
        ccolors.error("using"),
        ccolors.key_name("--set"),
        ccolors.key_name("deployment_target_provider=<provider>"),
      );

      await emitExitEvent(490);
      Deno.exit(490);
    }

    if (options.deploymentTargetLabel) {
      const [deployment_target_provider, deployment_target_distribution] =
        options.deploymentTargetLabel.split("/");

      if (!deployment_target_distribution) {
        console.error(
          initLabel,
          ccolors.error(
            `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(490);
        Deno.exit(490);
      }

      if (!deployment_target_provider) {
        console.error(
          initLabel,
          ccolors.error(
            `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(491);
        Deno.exit(491);
      }
      overrides.deployment_target_provider = deployment_target_provider;
      overrides.deployment_target_distribution = deployment_target_distribution;
    }

    const directoryContainsCNDIFiles = await checkInitialized(
      destinationDirectory,
    );

    const shouldContinue = directoryContainsCNDIFiles
      ? confirm(
        [
          ccolors.warn(
            "it looks like you have already initialized a cndi project in this directory:",
          ),
          ccolors.user_input(destinationDirectory),
          ccolors.prompt("\n\noverwrite existing artifacts?"),
        ].join(" "),
      )
      : true;

    if (!shouldContinue) {
      console.log();
      Deno.exit(0); // this event isn't handled by telemetry, it's just not very interesting
    }

    const templateNamesList: string[] = KNOWN_TEMPLATES.map((t) => t.name);

    if (options.interactive) {
      project_name = (await Input.prompt({
        message: ccolors.prompt("Please enter a name for your CNDI project:"),
        default: project_name,
      })) as string;
    }

    // GENERATE ENV VARS
    const sealedSecretsKeys = await createSealedSecretsKeys();
    const sshPublicKey = await createSshKeys();
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
      sshPublicKey,
      sealedSecretsKeys,
      terraformStatePassphrase,
      argoUIAdminPassword,
      debugMode: !!options.debug,
    };

    let deployment_target_provider;
    let templateResult;

    if (template) {
      try {
        templateResult = await useTemplate(
          template!,
          {
            interactive: !!options.interactive,
            overrides: {
              project_name,
              ...overrides,
            },
          },
        );
      } catch (e) {
        console.log(e.message);
        await emitExitEvent(e.cause);
        Deno.exit(e.cause);
      }

      cndi_config = templateResult.files["cndi_config.yaml"];
      await stageFile("cndi_config.yaml", cndi_config);

      readme = templateResult.files["README.md"];
      env = templateResult.files[".env"];

      deployment_target_provider = templateResult?.responses
        ?.deployment_target_provider;
      if (options.keep) {
        await stageFile(
          "cndi_responses.yaml",
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
    const readmePath = path.join(destinationDirectory, "README.md");
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

    if (deployment_target_provider !== "dev") {
      await stageFile(
        path.join(".github", "workflows", "cndi-run.yaml"),
        getCndiRunGitHubWorkflowYamlContents(options?.workflowRef),
      );
    }

    await stageFile(".gitignore", getGitignoreContents());

    const git_credentials_mode = templateResult?.responses.git_credentials_mode;
    const git_repo = templateResult?.responses.git_repo as string;

    if (git_credentials_mode === "ssh") {
      if (git_repo && git_repo.startsWith("https://")) {
        console.error(
          initLabel,
          "git_repo",
          ccolors.error(
            `must be specified as an ssh URL when ${
              ccolors.key_name("git_credentials_mode")
            } is set to ${ccolors.user_input("ssh")}`,
          ),
        );
        await emitExitEvent(4500);
        Deno.exit(4500);
      }
    }

    // there is one case where we don't want to persist the staged files
    if (options.create) {
      if (git_credentials_mode === "ssh") {
        // not implemented!
        console.error(
          initLabel,
          "git_credentials_mode",
          ccolors.error(
            `must be ${ccolors.key_name("token")} when using ${
              ccolors.key_name("--create")
            }`,
          ),
        );
        await emitExitEvent(4501);
        Deno.exit(4501);
      }

      const missingRequiredValuesForCreateRepo =
        checkForRequiredMissingCreateRepoValues({
          ...templateResult?.responses,
        });

      if (missingRequiredValuesForCreateRepo.length > 0) {
        console.error(
          initLabel,
          ccolors.error(
            `The following required values are missing for creating a new cndi cluster repo:`,
          ),
          ccolors.key_name(missingRequiredValuesForCreateRepo.join(", ")),
        );
        await emitExitEvent(400);
        Deno.exit(400);
      }
    }

    await persistStagedFiles(destinationDirectory);
    await owAction({
      output: destinationDirectory,
      initializing: true,
      create: options.create,
    });
  });

export default initCommand;
