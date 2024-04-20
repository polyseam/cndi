import { ccolors, Command, path, PromptTypes, YAML } from "deps";
import {
  checkForRequiredMissingCreateRepoValues,
  checkInitialized,
  emitExitEvent,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { owAction } from "src/commands/overwrite.ts";

import type { CNDITemplatePromptResponsePrimitive } from "src/use-template/types.ts";
import { KNOWN_TEMPLATES } from "consts";

import { createSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { createSshKeys } from "src/initialize/sshKeys.ts";
import { createTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { createArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";
import { useTemplate } from "src/use-template/mod.ts";

import getGitignoreContents from "src/outputs/gitignore.ts";
import vscodeSettings from "src/outputs/vscode-settings.ts";
import getCndiRunGitHubWorkflowYamlContents from "src/outputs/cndi-run-workflow.ts";
import getFinalEnvString from "src/outputs/dotenv.ts";

// Error Domain: 15XX
const createLabel = ccolors.faded("\nsrc/commands/create.ts:");

function validateGitHubSlug(value: string) {
  if (!value) {
    return "Owner/Repo slug is required";
  }
  if (!value.includes("/")) {
    return "Owner/Repo slug must be in the format owner/repo";
  }

  // TODO: check if repo exists ??

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
  .description("Create a new CNDI project.")
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
  .option(
    "--non-interactive",
    "Skip all Template prompts and use defaults",
  )
  .option(
    "-o, --output <output:string>",
    "Output directory",
    getProjectDirectoryFromFlag,
  )
  .option("--debug, -d", "Enable debug mode", { hidden: true })
  .option(
    "--deployment-target-label, -l <deployment_target_label:string>",
    "Label in the form of <provider>/<distribution> slug to specifying a deployment target",
  )
  .option(
    "--workflow-source-ref, -w <workflow_source_ref:string>",
    "A git ref pointing to the version of the cndi codebase to use in the 'cndi run' workflow",
    { hidden: true },
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
            `${ccolors.user_input("owner")}${ccolors.faded("/")}${
              ccolors.user_input("repo")
            }`,
            ccolors.prompt("slug where your project should be created:"),
          ].join(" "),
          validate: validateGitHubSlug,
        });
      } else {
        // if not in interactive mode, slug is required
        console.error(
          createLabel,
          ccolors.key_name("owner/repo"),
          ccolors.error("slug is required when using"),
          ccolors.user_input("--non-interactive"),
          ccolors.error("flag"),
        );
        await emitExitEvent(1500);
        Deno.exit(1500);
      }
    }

    // default to repo component of slug
    const [owner, repo] = slug.split("/"); // by this point, slug is valid

    let destinationDirectory = options.output ?? path.join(Deno.cwd(), repo);

    if (interactive && !options.output) {
      destinationDirectory = await PromptTypes.Input.prompt({
        message: ccolors.prompt(
          "Please confirm the destination directory for your CNDI project:",
        ),
        default: destinationDirectory,
      });
    }

    if (!template && !interactive) {
      console.error(
        [
          createLabel,
          ccolors.key_name("--template (-t)"),
          ccolors.error("is required when using"),
          ccolors.user_input("--non-interactive"),
        ].join(" "),
      );
      await emitExitEvent(1501);
      Deno.exit(1501);
    }

    // load responses from file
    let responsesFileText = "";
    try {
      responsesFileText = await Deno.readTextFile(
        options.responsesFile,
      );
    } catch (errorLoadingResponses) {
      if (errorLoadingResponses instanceof Deno.errors.NotFound) {
        // no responses file found, continue with defaults
      } else {
        console.error(
          createLabel,
          ccolors.error("Error loading"),
          ccolors.key_name("cndi_responses.yaml"),
          ccolors.error("file"),
        );
        ccolors.caught(errorLoadingResponses, 1502);
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
      if (responses) {
        overrides = responses as Record<
          string,
          CNDITemplatePromptResponsePrimitive
        >;
      }
    } catch (errorParsingResponses) {
      console.error(
        createLabel,
        ccolors.error("Error parsing"),
        ccolors.key_name("cndi_responses.yaml"),
        ccolors.error("file"),
      );
      ccolors.caught(errorParsingResponses, 1503);
      await emitExitEvent(1503);
      Deno.exit(1503);
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
        console.error(
          createLabel,
          ccolors.error(
            `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(1504);
        Deno.exit(1504);
      }

      const [deployment_target_provider, deployment_target_distribution] = slug;

      if (!deployment_target_distribution) {
        console.error(
          createLabel,
          ccolors.error(
            `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(1504);
        Deno.exit(1504);
      }

      if (!deployment_target_provider) {
        console.error(
          createLabel,
          ccolors.error(
            `--deployment-target-label (-l) flag requires a slug in the form of <provider>/<distribution>`,
          ),
        );
        await emitExitEvent(1504);
        Deno.exit(1504);
      }

      overrides.deployment_target_provider = deployment_target_provider;
      overrides.deployment_target_distribution = deployment_target_distribution;
    }

    if (!interactive && !overrides?.deployment_target_provider) {
      console.error(
        [
          createLabel, // this stems from the decision that CNDI will not choose a provider for you
          ccolors.error("CNDI will not choose a deployment"),
          ccolors.key_name("provider"),
          ccolors.error(
            `for you in ${ccolors.user_input("--non-interactive")} mode.\n\n`,
          ),
          createLabel,
          ccolors.error("Please supply a provider using"),
          ccolors.key_name(
            "--deployment-target-label",
          ),
          `${ccolors.user_input("<provider>")}${ccolors.faded("/")}${
            ccolors.user_input("<distribution>")
          }`,
          ccolors.error("flag"),
          createLabel,
          ccolors.error("or otherwise"),
          ccolors.key_name("override"),
          ccolors.error("the"),
          ccolors.key_name("deployment_target_provider"),
          ccolors.error("response"),
        ].join(" "),
      );
      await emitExitEvent(1504);
      Deno.exit(1504);
    }

    let project_name = repo;

    if (interactive) {
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
      Deno.exit(0); // this event isn't handled by telemetry, it's just not very interesting
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
      throw new Error("template is undefined");
    }

    // GENERATE ENV VARS
    const sealedSecretsKeys = await createSealedSecretsKeys();
    const sshPublicKey = await createSshKeys();
    const terraformStatePassphrase = createTerraformStatePassphrase();
    const argoUIAdminPassword = createArgoUIAdminPassword();

    const cndiGeneratedValues = {
      sshPublicKey,
      sealedSecretsKeys,
      terraformStatePassphrase,
      argoUIAdminPassword,
      debugMode: !!options.debug,
    };

    let templateResult;

    try {
      templateResult = await useTemplate(template, {
        interactive,
        overrides: {
          project_name,
          ...overrides,
          // by placing this last, users will be unable to override these values to their own detriment
          git_repo: `https://github.com/${owner}/${repo}`,
          git_credentials_mode: "token",
        },
      });
    } catch (error) {
      console.log(error.message);
      await emitExitEvent(error.cause);
      Deno.exit(error.cause);
    }

    const deployment_target_provider =
      templateResult.responses.deployment_target_provider;

    const cndi_config = templateResult.files["cndi_config.yaml"];
    const env = templateResult.files[".env"];
    const readme = templateResult.files["README.md"];

    await stageFile("cndi_config.yaml", cndi_config);

    await stageFile(
      "cndi_responses.yaml",
      YAML.stringify(templateResult.responses),
    );

    await stageFile(".env", getFinalEnvString(env, cndiGeneratedValues));

    await stageFile("README.md", readme);

    await stageFile(
      path.join(".vscode", "settings.json"),
      getPrettyJSONString(vscodeSettings),
    );

    await stageFile(".gitignore", getGitignoreContents());

    await stageFile(
      path.join(".github", "workflows", "cndi-run.yaml"),
      getCndiRunGitHubWorkflowYamlContents(
        options.workflowSourceRef,
        deployment_target_provider === "dev",
      ),
    );

    const git_credentials_mode = templateResult.responses.git_credentials_mode;

    if (git_credentials_mode === "ssh") {
      console.error(
        createLabel,
        ccolors.key_name("git_credentials_mode"),
        ccolors.error("must be set to"),
        ccolors.user_input("token"),
        ccolors.error("when running"),
        ccolors.user_input("cndi create"),
      );
      await emitExitEvent(1505);
      Deno.exit(1505);
    }

    // TODO: consider this more carefully
    const missingRequiredValuesForCreateRepo =
      checkForRequiredMissingCreateRepoValues({
        ...templateResult?.responses,
      });

    if (missingRequiredValuesForCreateRepo.length > 0) {
      console.error(
        createLabel,
        ccolors.error(
          `The following required values are missing for creating a new cndi cluster repo:`,
        ),
        ccolors.key_name(missingRequiredValuesForCreateRepo.join(", ")),
      );
      await emitExitEvent(1507);
      Deno.exit(1507);
    }

    await persistStagedFiles(destinationDirectory);
    await owAction({
      output: destinationDirectory,
      initializing: true,
      create: true,
      skipPush,
    });
  });

export default createCommand;
