import { ccolors, Command, path, PromptTypes, YAML } from "deps";
import { emitExitEvent, getProjectDirectoryFromFlag } from "src/utils.ts";
import type { CNDITemplatePromptResponsePrimitive } from "src/use-template/types.ts";

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
  yes?: unknown;
  output?: string;
};

const echoCreate = (options: EchoCreateOptions, slug?: string) => {
  const cndiCreate = "cndi create";
  const cndiCreateSlug = slug ? ` ${slug}` : "";
  const cndiCreateInteractive = options.yes ? ccolors.user_input(" --yes") : "";
  const cndiCreateTemplate = options.template
    ? ` --template ${options.template}`
    : "";
  const cndiCreateOutput = options.output ? ` --output ${options.output}` : "";
  const cndiCreateSet = options.set ? ` --set ${options.set.join(" ")}` : "";
  console.log(
    `${cndiCreate}${cndiCreateSlug}${cndiCreateInteractive}${cndiCreateTemplate}${cndiCreateOutput}${cndiCreateSet}\n`,
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
    `-s, --set <set>`,
    `Override a response, usage: --set responseName=responseValue`,
    {
      collect: true,
      equalsSign: true,
    },
  )
  .option(
    "-y, --yes, --non-interactive",
    "Skip all Template prompts and use defaults",
  )
  .option(
    "-o, --output <output:string>",
    "Output directory",
    getProjectDirectoryFromFlag,
  )
  .option("--debug, -d", "Enable debug mode", { hidden: true })
  .action(async (options, slug) => {
    echoCreate(options, slug);
    const interactive = !options.yes;
    let template: string | undefined = options?.template;
    let overrides: Record<string, CNDITemplatePromptResponsePrimitive> = {};

    if (!slug) {
      if (interactive) {
        slug = await PromptTypes.Input.prompt({
          message: [
            ccolors.prompt("Please enter the GitHub"),
            ccolors.key_name("owner/repo"),
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
          ccolors.user_input("--yes"),
          ccolors.error("flag"),
        );
        await emitExitEvent(1500);
        Deno.exit(1500);
      }
    }

    // default to repo component of slug
    const [owner, repo] = slug.split("/"); // by this point, slug is valid

    const destinationDirectory = options.output ?? repo;

    if (!template) {
      if (!interactive) {
        console.error(
          [
            createLabel,
            ccolors.key_name("--template (-t)"),
            ccolors.error("is required when using"),
            ccolors.user_input("--yes"),
            ccolors.user_input("(-y)"),
          ].join(" "),
        );
        await emitExitEvent(1501);
        Deno.exit(1501);
      }
    }

    // load responses from file
    let responsesFileText = "";
    try {
      responsesFileText = await Deno.readTextFile(
        path.join(Deno.cwd(), "cndi_responses.yaml"),
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

    let cndi_config: string;
    let env: string;
    let project_name = repo;
  });

export default createCommand;
