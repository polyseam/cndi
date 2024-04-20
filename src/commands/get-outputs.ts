import { ccolors, Command, loadEnv, path, simpleGit } from "deps";
import {
  emitExitEvent,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
} from "src/utils.ts";

const getOutputsLabel = ccolors.faded("\nsrc/commands/get-outputs.ts:");

//
const stripUncompressedJSONZipFileMetadata = (zipFile: string): string => {
  const lines = zipFile.split("\n");
  lines[0] = "{";
  lines.pop();
  return lines.join("\n");
};

/**
 * COMMAND cndi get-outputs
 * Downloads the outputs of the latest successful cndi run
 */
const getOutputsCommand = new Command()
  .description(`Download the outputs from the latest run.`)
  .option("-p, --path <path:string>", "path to your cndi git repository", {
    default: Deno.cwd(),
  })
  .option(
    "-o, --output <output:string>",
    "Output directory",
    getProjectDirectoryFromFlag,
  )
  .env(
    "GIT_REPO=<value:string>",
    "URL of your git repository where your cndi project is hosted.",
    { required: true },
  )
  .env(
    "GIT_USERNAME=<value:string>",
    "Username ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .env(
    "GIT_TOKEN=<value:string>",
    "Personal access token ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .env(
    "GIT_SSH_PRIVATE_KEY=<value:string>",
    "SSH Private Key ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .action(async (options) => {
    const cmd = "cndi get-outputs";

    console.log(`${cmd}\n`);

    const git = simpleGit(options.output);
    const sha = await git.revparse(["HEAD"]);

    if (!sha) {
      console.error(
        getOutputsLabel,
        ccolors.error(`Could not determine the current git commit SHA`),
      );
      await emitExitEvent(4000);
      Deno.exit(4000);
    }

    let repoUrl: URL;

    try {
      const ghAvailableCmd = new Deno.Command("gh", {
        args: ["gh", "--version"],
      });
      await ghAvailableCmd.output();
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        throw new Error(
          [
            getOutputsLabel,
            ccolors.error(
              "'gh' CLI must be installed and added to PATH when using",
            ),
            ccolors.key_name("cndi get-outputs"),
          ].join(" "),
          { cause: 46000 },
        );
      }
    }

    const envPath = path.join(options?.output || Deno.cwd(), ".env");

    await loadEnv({
      envPath,
      export: true,
    });

    const repoUrlString = Deno.env.get("GIT_REPO")!;
    const GIT_TOKEN = Deno.env.get("GIT_TOKEN")!;

    try {
      repoUrl = new URL(repoUrlString);
    } catch (error) {
      console.error(
        getOutputsLabel,
        ccolors.error(
          `Could not parse the provided 'GIT_REPO' url as a valid URL`,
        ),
        ccolors.caught(error, 4000),
      );
      await emitExitEvent(4000);
      Deno.exit(4000);
    }

    try {
      const apiPath = `repos${repoUrl.pathname}/actions/artifacts`;

      const ghGetOutputsCommand = new Deno.Command("gh", {
        args: ["api", apiPath],
        env: {
          GH_TOKEN: GIT_TOKEN,
        },
        cwd: options.output,
        stdout: "piped",
        stderr: "piped",
      });

      const ghGetOutputsChildProcess = ghGetOutputsCommand.spawn();

      const getOutputsOutput = await ghGetOutputsChildProcess.output();

      const outputString = new TextDecoder().decode(getOutputsOutput.stdout);

      const { artifacts } = JSON.parse(outputString) as {
        artifacts: Array<
          {
            updated_at: string;
            workflow_run: { head_sha: string };
            archive_download_url: string;
          }
        >;
      };

      const artifact = artifacts.filter((el) =>
        el.workflow_run.head_sha === sha
      ).sort((a, b) => {
        const aUpdatedAt = new Date(a.updated_at).getTime();
        const bUpdatedAt = new Date(b.updated_at).getTime();
        return bUpdatedAt - aUpdatedAt;
      })[0];

      const archiveUrl = new URL(artifact.archive_download_url);

      const ghDownloadOutputsCommand = new Deno.Command("gh", {
        args: [
          "api",
          archiveUrl.pathname,
        ],
        env: {
          GH_TOKEN: GIT_TOKEN,
        },
        cwd: options.output,
        stdout: "piped",
        stderr: "piped",
      });

      const ghDownloadOutputsChildProcess = ghDownloadOutputsCommand.spawn();

      const downloadOutputsOutput = await ghDownloadOutputsChildProcess
        .output();

      const downloadOutputsStringZipped = new TextDecoder().decode(
        downloadOutputsOutput.stdout,
      );

      const downloadOutputsString = stripUncompressedJSONZipFileMetadata(
        downloadOutputsStringZipped,
      );
      const downloadOutputs = JSON.parse(downloadOutputsString);
      const outputs: Record<string, string> = {};

      for (const outputKey in downloadOutputs) {
        outputs[outputKey] = downloadOutputs[outputKey].value;
      }

      Deno.writeTextFileSync(
        "terraform_output.json",
        getPrettyJSONString(outputs),
      );
    } catch (error) {
      console.log("error");
      console.error(error);
    }

    await emitExitEvent(0);
  });

export default getOutputsCommand;
