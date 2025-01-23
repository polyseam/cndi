import { ccolors, Command, path, PromptTypes, YAML } from "deps";

const { Input, Select } = PromptTypes;

import {
  checkForRequiredMissingCreateRepoValues,
  checkInitialized,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { ErrOut } from "errout";

import { useTemplate } from "src/use-template/mod.ts";

import type { CNDITemplatePromptResponsePrimitive } from "src/use-template/types.ts";

import { KNOWN_TEMPLATES } from "known-templates";

import { owAction } from "src/commands/overwrite.ts";

import { createSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { createSshKeys } from "src/initialize/sshKeys.ts";

import getGitignoreContents from "src/outputs/gitignore.ts";
import vscodeSettings from "src/outputs/vscode-settings.ts";
import getFinalEnvString from "src/outputs/dotenv.ts";

const label = ccolors.faded("\nsrc/commands/init.ts:");

const defaultResponsesFilePath = path.join(Deno.cwd(), "cndi_responses.yaml");

type EchoInitOptions = {
  interactive?: boolean;
  template?: string;
  output?: string;
  deploymentTargetLabel?: string;
  keep?: boolean;
  create?: boolean;
  skipPush?: boolean;
};

const echoInit = (options: EchoInitOptions) => {
  const cndiInit = "cndi init";
  const cndiInitCreate = options.create ? " --create" : "";
  const cndiInitSkipPush = options.skipPush ? " --skip-push" : "";
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
    `${cndiInit}${cndiInitCreate}${cndiInitInteractive}${cndiInitTemplate}${deploymentTargetLabel}${cndiInitOutput}${cndiInitSkipPush}\n`,
  );
};

/**
 * COMMAND cndi init
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const initCommand = new Command()
  .description(`Initialize new cndi project.`)
  .option(
    "-o, --output, --project, -p <output:string>",
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
    "Path to YAML 'responses file' to supply to Template prompts.",
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
    "-w, --run-workflow-source-ref <workflow_source_ref:string>",
    "Specify a ref to build a cndi-run workflow with",
    {
      hidden: true,
    },
  )
  .option(
    "--deployment-target-label, -l <deployment_target_label:string>",
    "Label in the form of <provider/distribution> slug to specifying a deployment target",
  )
  .option("-k, --keep", "Keep responses in cndi_responses.yaml")
  .option("-c, --create", "Create a new cndi cluster repo")
  .option("--skip-push", "Skip pushing to the remote repository", {
    depends: ["create"],
  })
  .action(async (options) => {
    // default to the current working directory if -o, --output is ommitted
    const destinationDirectory = options?.output || Deno.cwd();

    echoInit({ ...options, output: destinationDirectory });

    let template: string | undefined = options.template;
    let overrides: Record<string, CNDITemplatePromptResponsePrimitive> = {};

    if (!template && !options.interactive) {
      const err = new ErrOut(
        [`--interactive (-i) flag is required if no template is specified`],
        {
          code: 400,
          label,
          id: "!interactive&&!template",
        },
      );
      await err.out();
      return;
    }

    if (options.responsesFile === defaultResponsesFilePath) {
      // attempting to load responses file from CWD, if it doesn't exist that's fine
      try {
        const responseFileText = await Deno.readTextFile(options.responsesFile);
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
        responseFileText = await Deno.readTextFile(options.responsesFile);
      } catch (errorReadingSuppliedResponseFile) {
        const err = new ErrOut(
          [ccolors.error("Could not load responses file from provided path")],
          {
            code: 401,
            label,
            id:
              "!readTextFile(options.responsesFile)&&!isDefault(options.responsesFile)",
            cause: errorReadingSuppliedResponseFile as Error,
            metadata: {
              responsesFile: options.responsesFile,
            },
          },
        );
        await err.out();
        return;
      }

      try {
        const responses = YAML.parse(responseFileText);
        if (responses) {
          overrides = responses as Record<
            string,
            CNDITemplatePromptResponsePrimitive
          >;
        }
      } catch (cause) {
        const err = new ErrOut(
          [
            ccolors.error(
              "Could not parse file as responses YAML from provided path",
            ),
            ccolors.key_name(`"${options.responsesFile}"`),
          ],
          {
            code: 402,
            label,
            id: "!YAML.parse(responseFileText)",
            cause: cause as Error,
            metadata: {
              responsesFile: options.responsesFile,
            },
          },
        );

        await err.out();
        return;
      }
    }

    if (options.set) {
      for (const set of options.set) {
        const [key, value] = set.split("=");
        overrides[key] = value;
      }
    }

    let project_name = destinationDirectory.split(path.SEPARATOR).pop() ||
      "my-cndi-project"; // default to the current working directory name

    if (options.template === "true") {
      const err = new ErrOut([
        ccolors.error(`--template (-t) flag requires a value`),
      ], {
        label,
        code: 400,
        id: 'options.template==="true"',
      });
      await err.out();
      return;
    }

    const noProvider = !options.interactive &&
      !options.deploymentTargetLabel &&
      !overrides.deployment_target_provider;

    if (noProvider) {
      const err = new ErrOut(
        [
          ccolors.key_name("deployment_target_provider"),
          ccolors.error(`is required when not running in`),
          ccolors.key_name("--interactive"),
          ccolors.error(`mode`),
          ccolors.error("you can set this value using"),
          ccolors.key_name(
            "--deployment-target-label (-l) <provider>/<distribution>",
          ),
          ccolors.error("or"),
          ccolors.error("using"),
          ccolors.key_name("--set"),
          ccolors.key_name("deployment_target_provider=<provider>"),
        ],
        { label, code: 403, id: "!provider&&!interactive" },
      );
      await err.out();
      return;
    }

    if (options.deploymentTargetLabel) {
      const [deployment_target_provider, deployment_target_distribution] =
        options.deploymentTargetLabel.split("/");

      if (!deployment_target_distribution) {
        const err = new ErrOut(
          [
            ccolors.error(
              `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
            ),
          ],
          {
            label,
            code: 404,
            id: "!deployment_target_distribution",
          },
        );
        await err.out();
        return;
      }

      if (!deployment_target_provider) {
        const err = new ErrOut(
          [
            ccolors.error(
              `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
            ),
          ],
          {
            label,
            code: 404,
            id: "!deployment_target_provider",
          },
        );
        await err.out();
        return;
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

    if (options.interactive && !template) {
      template = await Select.prompt({
        message: ccolors.prompt("Pick a template"),
        search: true,
        options: templateNamesList,
      });
    }

    const [errUsingTemplate, templateResult] = await useTemplate(template!, {
      interactive: !!options.interactive,
      overrides: {
        project_name,
        ...overrides,
      },
    });

    if (errUsingTemplate) {
      await errUsingTemplate.out();
      return;
    }

    if (options.keep) {
      const errStagingResponses = await stageFile(
        "cndi_responses.yaml",
        YAML.stringify(templateResult.responses),
      );
      if (errStagingResponses) {
        await errStagingResponses.out();
        return;
      }
    }

    const isClusterless =
      templateResult?.responses?.deployment_target_distribution ===
        "clusterless";

    for (const [key, value] of Object.entries(templateResult.files)) {
      // .env must be extended using generated values
      if (key === ".env") {
        const env = value;

        // GENERATE ENV VARS
        const sealedSecretsKeys = isClusterless
          ? null
          : await createSealedSecretsKeys();

        const doSSH =
          templateResult?.responses?.deployment_target_distribution ===
            "microk8s";

        const [errCreatingSshKeys, sshPublicKey] = doSSH
          ? await createSshKeys()
          : [null, null];

        if (errCreatingSshKeys) {
          await errCreatingSshKeys.out();
          return;
        }

        const dotEnvOptions = {
          sshPublicKey,
          sealedSecretsKeys,
          debugMode: !!options.debug,
        };

        const errStagingDotenv = await stageFile(
          ".env",
          getFinalEnvString(env, dotEnvOptions),
        );
        if (errStagingDotenv) {
          await errStagingDotenv.out();
          return;
        }
      } else {
        const errStagingFiles = await stageFile(key, value);
        if (errStagingFiles) {
          await errStagingFiles.out();
          return;
        }
      }
    }

    const errStagingVSCodeSettings = await stageFile(
      path.join(".vscode", "settings.json"),
      getPrettyJSONString(vscodeSettings),
    );

    if (errStagingVSCodeSettings) {
      await errStagingVSCodeSettings.out();
      return;
    }

    const errStagingGitignore = await stageFile(
      ".gitignore",
      getGitignoreContents(),
    );
    if (errStagingGitignore) {
      await errStagingGitignore.out();
      return;
    }

    const git_credentials_mode = templateResult?.responses.git_credentials_mode;
    const git_repo = templateResult?.responses.git_repo as string;

    if (git_credentials_mode === "ssh") {
      if (git_repo && git_repo.startsWith("https://")) {
        const err = new ErrOut(
          [
            ccolors.key_name("git_repo"),
            ccolors.error("must be specified as an ssh URL when"),
            ccolors.key_name("git_credentials_mode"),
            ccolors.error("is set to"),
            ccolors.user_input("ssh"),
          ],
          {
            label,
            code: 405,
            id: "git_credentials_mode===ssh&git_repo.startsWith(https)",
          },
        );
        await err.out();
        return;
      }
    }

    // there is one case where we don't want to persist the staged files
    if (options.create) {
      if (git_credentials_mode === "ssh") {
        // not implemented!
        const err = new ErrOut([
          ccolors.key_name("git_credentials_mode"),
          ccolors.error(`must be`),
          ccolors.key_name("token"),
          ccolors.error(`when using`),
          ccolors.key_name("--create"),
        ], {
          label,
          code: 406,
          id: "git_credentials_mode===ssh&options.create",
        });
        await err.out();
        return;
      }

      const missingRequiredValuesForCreateRepo =
        checkForRequiredMissingCreateRepoValues({
          ...templateResult?.responses,
        });

      if (missingRequiredValuesForCreateRepo.length > 0) {
        const err = new ErrOut([
          ccolors.error(
            `The following required values are missing for creating a new cndi cluster repo:`,
          ),
          ccolors.key_name(missingRequiredValuesForCreateRepo.join(", ")),
        ], {
          label,
          code: 407,
          id: "init/missingRequiredValuesForCreateRepo",
        });
        await err.out();
        return;
      }
    }

    await persistStagedFiles(destinationDirectory);

    await owAction({
      output: destinationDirectory,
      initializing: true,
      runWorkflowSourceRef: options.runWorkflowSourceRef,
      create: !!options.create,
      skipPush: !!options.skipPush,
    });
  });

export default initCommand;
