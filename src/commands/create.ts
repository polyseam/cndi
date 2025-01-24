import {
  ccolors,
  Command,
  path,
  PromptTypes,
  ValidateResult,
  YAML,
} from "deps";

import {
  checkForRequiredMissingCreateRepoValues,
  checkInitialized,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
  isSlug,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { owAction } from "src/commands/overwrite.ts";

import type { CNDITemplatePromptResponsePrimitive } from "src/use-template/types.ts";
import { KNOWN_TEMPLATES } from "known-templates";

import { createSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { createSshKeys } from "src/initialize/sshKeys.ts";
import { useTemplate } from "src/use-template/mod.ts";

import getGitignoreContents from "src/outputs/gitignore.ts";
import vscodeSettings from "src/outputs/vscode-settings.ts";

import getFinalEnvString from "src/outputs/dotenv.ts";

import { ErrOut } from "errout";

// Error Domain: 15XX
const label = ccolors.faded("\nsrc/commands/create.ts:");

function validateGitHubSlug(value: string): ValidateResult {
  if (!value.includes("/")) {
    return "Owner/Repo slug argument must be in the format owner/repo";
  }

  const githubOwnerRepoTuple = value.split("/");

  const [owner, repo] = githubOwnerRepoTuple;

  if (githubOwnerRepoTuple.length !== 2) {
    return "owner/repo slug argument must be in the format owner/repo";
  }

  if (!isSlug(owner)) {
    return "owner component of slug must only contain alphanumeric characters and hyphens";
  }

  if (!isSlug(repo)) {
    return "repo component of slug must only contain alphanumeric characters and hyphens";
  }
  return true;
}

type EchoCreateOptions = {
  template?: string;
  set?: string[];
  nonInteractive?: unknown;
  output?: string;
  deploymentTargetLabel?: string;
  responsesFile: string;
  skipPush?: boolean;
};

const echoCreate = (options: EchoCreateOptions, slug?: string) => {
  const cndiCreate = "cndi create";
  const cndiCreateSlug = slug ? ` ${slug}` : "";
  const cndiCreateInteractive = options.nonInteractive
    ? ccolors.user_input(" --non-interactive")
    : "";
  const cndiCreateTemplate = options.template
    ? ` --template ${options.template}`
    : "";
  const cndiCreateOutput = options.output ? ` --output ${options.output}` : "";
  const cndiCreateSet = options.set ? ` --set ${options.set.join(" ")}` : "";
  const cndiCreateDeploymentTargetLabel = options.deploymentTargetLabel
    ? ` --deployment-target-label ${options.deploymentTargetLabel}`
    : "";
  const cndiCreateSkipPush = options.skipPush ? " --skip-push" : "";
  console.log(
    `${cndiCreate}${cndiCreateSlug}${cndiCreateInteractive}${cndiCreateTemplate}${cndiCreateOutput}${cndiCreateDeploymentTargetLabel}${cndiCreateSet}${cndiCreateSkipPush}\n`,
  );
};

/**
 * COMMAND cndi create <owner-repo-slug>
 * `cndi init --create` but convenient
 * --interactive by default
 * --keep by default
 * --template flag to specify template
 * --label <provider-distribution-slug> to specify the label
 */
const createCommand = new Command()
  .description(`Create a new cndi project repo.`)
  .arguments("[owner/repo-slug:string]")
  .option(
    "-t, --template <template:string>",
    "CNDI Template to use for the new project.",
  )
  .option(
    "-r, --responses-file <responses_file:string>",
    "Path to YAML 'responses file' to supply to Template prompts.",
    {
      default: path.join(Deno.cwd(), "cndi_responses.yaml"),
    },
  )
  .option("--skip-push", "Skip pushing to remote repository")
  .option(
    `-s, --set <set>`,
    `Override a response, usage: --set responseName=responseValue`,
    {
      collect: true,
      equalsSign: true,
    },
  )
  .option("--non-interactive", "Skip all Template prompts and use defaults")
  .option(
    "-o, --output <output:string>",
    "Destination for new cndi project files.",
    getProjectDirectoryFromFlag,
  )
  .option("--debug, -d", "Enable debug mode", { hidden: true })
  .option(
    "--deployment-target-label, -l <deployment_target_label:string>",
    "Label in the form of <provider>/<distribution> slug to specifying a deployment target",
  )
  .option(
    "-w, --run-workflow-source-ref <workflow_source_ref:string>",
    "Specify a ref to build a cndi-run workflow with",
    {
      hidden: true,
    },
  )
  .action(async (options, slug) => {
    echoCreate(options, slug);
    const skipPush = options.skipPush;
    const interactive = !options.nonInteractive;
    let template: string | undefined = options?.template;
    let overrides: Record<string, CNDITemplatePromptResponsePrimitive> = {};

    if (!slug) {
      if (interactive) {
        slug = await PromptTypes.Input.prompt({
          message: [
            ccolors.prompt("Please enter the GitHub"),
            `${ccolors.user_input("owner")}${
              ccolors.faded(
                "/",
              )
            }${ccolors.user_input("repo")}`,
            ccolors.prompt("slug where your project should be created:"),
          ].join(" "),
          validate: validateGitHubSlug,
        });
      } else {
        // if not in interactive mode, slug is required
        const err = new ErrOut(
          [
            ccolors.key_name("owner/repo"),
            ccolors.error("slug is required when using"),
            ccolors.user_input("--non-interactive"),
            ccolors.error("flag"),
          ],
          {
            label,
            code: 1500,
            id: "create/!interactive&&!slug",
          },
        );
        await err.out();
        return;
      }
    } else {
      const slugValidationErrorMessage = validateGitHubSlug(slug);

      if (typeof slugValidationErrorMessage === "string") {
        const err = new ErrOut([ccolors.error(slugValidationErrorMessage)], {
          label,
          code: 1500,
          id: "create/!slugValidation",
        });
        await err.out();
        return;
      }
    }

    // default to repo component of slug
    const [owner, repo] = slug.split("/"); // by this point, slug is valid

    let destinationDirectory = options?.output || path.join(Deno.cwd(), repo);

    if (interactive && !options.output) {
      destinationDirectory = await PromptTypes.Input.prompt({
        message: ccolors.prompt(
          "Please confirm the destination directory for your CNDI project:",
        ),
        default: destinationDirectory,
      });
    }

    if (!template && !interactive) {
      const err = new ErrOut(
        [
          ccolors.key_name("--template (-t)"),
          ccolors.error("is required when using"),
          ccolors.user_input("--non-interactive"),
        ],
        {
          label,
          code: 1501,
          id: "create/!template&&!interactive",
        },
      );
      await err.out();
      return;
    }

    // load responses from file
    let responsesFileText = "";

    try {
      responsesFileText = await Deno.readTextFile(options.responsesFile);
    } catch (errLoadingResponsesFile) {
      if (errLoadingResponsesFile instanceof Deno.errors.NotFound) {
        // no responses file found, continue with defaults
      } else {
        console.error(
          label,
          ccolors.error("Error loading"),
          ccolors.key_name("cndi_responses.yaml"),
          ccolors.error("file"),
        );
        ccolors.caught(errLoadingResponsesFile as Error, 1502);
        console.log(
          ccolors.warn(
            "⚠️ continuing with defaults in spite of unexpected error",
          ),
        );
      }
    }

    let responses: Record<string, CNDITemplatePromptResponsePrimitive> = {};

    try {
      responses = YAML.parse(responsesFileText) as Record<
        string,
        CNDITemplatePromptResponsePrimitive
      >;
    } catch (errorParsingResponses) {
      const err = new ErrOut(
        [
          ccolors.error("Error parsing"),
          ccolors.key_name("cndi_responses.yaml"),
          ccolors.error("file"),
        ],
        {
          label,
          code: 1503,
          id: "create/!isValidYAML(responsesFile)",
          cause: errorParsingResponses as Error,
        },
      );
      await err.out();
      return;
    }

    const responseCount = Object.keys(responses).length;

    if (responseCount) {
      console.log();
      console.log(
        ccolors.key_name("cndi"),
        "is pulling",
        ccolors.success(responseCount.toString()),
        "responses from",
        ccolors.success(options.responsesFile) +
          "!",
      );
      console.log();
      overrides = responses as Record<
        string,
        CNDITemplatePromptResponsePrimitive
      >;
    }

    if (options.set) {
      for (const set of options.set) {
        const [key, value] = set.split("=");
        overrides[key] = value;
      }
    }

    if (options.deploymentTargetLabel) {
      const slug = options.deploymentTargetLabel.split("/");

      if (slug.length !== 2) {
        const err = new ErrOut(
          [
            ccolors.error(
              `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
            ),
          ],
          {
            label,
            code: 1504,
            id: "create/!isValidSlug(deploymentTargetLabel)",
          },
        );
        await err.out();
        return;
      }

      const [deployment_target_provider, deployment_target_distribution] = slug;

      if (!deployment_target_distribution) {
        const err = new ErrOut(
          [
            ccolors.error(
              `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
            ),
          ],
          {
            label,
            code: 1504,
            id: "create/!deployment_target_distribution",
          },
        );
        await err.out();
        return;
      }

      overrides.deployment_target_provider = deployment_target_provider;
      overrides.deployment_target_distribution = deployment_target_distribution;
    }

    if (!interactive && !overrides?.deployment_target_provider) {
      const err = new ErrOut(
        [
          ccolors.error("CNDI will not choose a deployment"),
          ccolors.key_name("provider"),
          ccolors.error(
            `for you in ${ccolors.user_input("--non-interactive")} mode.\n\n`,
          ),
          label,
          ccolors.error("Please supply a provider using"),
          ccolors.key_name("--deployment-target-label"),
          `${ccolors.user_input("<provider>")}${
            ccolors.faded(
              "/",
            )
          }${ccolors.user_input("<distribution>")}`,
          ccolors.error("flag"),
          label,
          ccolors.error("or otherwise"),
          ccolors.key_name("override"),
          ccolors.error("the"),
          ccolors.key_name("deployment_target_provider"),
          ccolors.error("response"),
        ],
        { label, code: 1504, id: "create/!deployment_target_provider" },
      );
      await err.out();
      return;
    }

    let project_name = repo;

    if (overrides?.project_name) {
      project_name = `${overrides.project_name}`;
    } else if (interactive) {
      project_name = await PromptTypes.Input.prompt({
        message: ccolors.prompt("Please enter a name for your CNDI project:"),
        default: project_name,
      });
    }

    const directoryContainsCNDIFiles = await checkInitialized(
      destinationDirectory,
    );

    let shouldContinue = true;

    if (directoryContainsCNDIFiles) {
      if (!interactive) {
        shouldContinue = false;
      } else {
        shouldContinue = confirm(
          [
            ccolors.warn(
              "It looks like you have already initialized a cndi project in this directory:",
            ),
            ccolors.user_input(destinationDirectory),
            ccolors.prompt("\n\nShould we overwrite existing artifacts? 🗑️"),
          ].join(" "),
        );
      }
    }

    if (!shouldContinue) {
      console.log();
      return;
    }

    const templateNamesList: Array<string> = KNOWN_TEMPLATES.map((t) => t.name);

    if (interactive && !template) {
      template = await PromptTypes.Select.prompt({
        message: ccolors.prompt("Pick a Template:"),
        search: true,
        options: templateNamesList,
      });
    }

    if (!template) {
      // this is impossible
      const err = new ErrOut(
        [
          ccolors.error("internal error!"),
          ccolors.warn("template"),
          ccolors.error("argument is undefined"),
        ],
        {
          code: 1505,
          label,
          id: "create/!template",
        },
      );
      await err.out();
      return;
    }

    const [useTemplateErr, templateResult] = await useTemplate(template, {
      interactive,
      overrides: {
        project_name,
        ...overrides,
        // by placing this last, users will be unable to override these values to their own detriment
        git_repo: `https://github.com/${owner}/${repo}`,
        git_credentials_mode: "token",
      },
    });

    if (useTemplateErr) {
      await useTemplateErr.out();
      return;
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

        const [err, sshPublicKey] = doSSH
          ? await createSshKeys()
          : [null, null];

        if (err) {
          await err.out();
          return;
        }

        const dotEnvOptions = {
          sshPublicKey,
          sealedSecretsKeys,
          debugMode: !!options.debug,
        };

        const errStagingEnv = await stageFile(
          ".env",
          getFinalEnvString(env, dotEnvOptions),
        );
        if (errStagingEnv) {
          await errStagingEnv.out();
          return;
        }
      } else {
        const errStagingFile = await stageFile(key, value);
        if (errStagingFile) {
          await errStagingFile.out();
          return;
        }
      }
    }

    const templateResultResponsesErr = await stageFile(
      "cndi_responses.yaml",
      YAML.stringify(templateResult.responses),
    );

    if (templateResultResponsesErr) {
      await templateResultResponsesErr.out();
      return;
    }

    const errStagingVscodeSettings = await stageFile(
      path.join(".vscode", "settings.json"),
      getPrettyJSONString(vscodeSettings),
    );

    if (errStagingVscodeSettings) {
      await errStagingVscodeSettings.out();
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

    const git_credentials_mode = templateResult.responses.git_credentials_mode;

    if (git_credentials_mode === "ssh") {
      const err = new ErrOut(
        [
          ccolors.key_name("git_credentials_mode"),
          ccolors.error("must be set to"),
          ccolors.user_input("token"),
          ccolors.error("when running"),
          ccolors.user_input("cndi create"),
        ],
        {
          label,
          code: 1505,
          id: "create/git_credentials_mode==ssh",
        },
      );
      await err.out();
      return;
    }

    // TODO: consider this more carefully
    const missingRequiredValuesForCreateRepo =
      checkForRequiredMissingCreateRepoValues({
        ...templateResult?.responses,
      });

    if (missingRequiredValuesForCreateRepo.length > 0) {
      const err = new ErrOut(
        [
          ccolors.error(
            `The following required values are missing for creating a new cndi cluster repo:`,
          ),
          ccolors.key_name(missingRequiredValuesForCreateRepo.join(", ")),
        ],
        { label, code: 1506, id: "create/!requiredValuesForCreateRepo" },
      );
      await err.out();
      return;
    }

    await persistStagedFiles(destinationDirectory);

    await owAction({
      output: destinationDirectory,
      initializing: true,
      create: true,
      runWorkflowSourceRef: options.runWorkflowSourceRef,
      skipPush: !!skipPush,
    });
  });

export default createCommand;
