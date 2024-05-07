import { ccolors, loadEnv, path, simpleGit, writeAll } from "deps";
import { emitExitEvent } from "src/utils.ts";

const createRepoLabel = ccolors.faded("\nsrc/actions/createRepo.ts:");

type CreateRepoOptions = {
  output: string;
  skipPush?: boolean;
};

export default async function createRepo(options: CreateRepoOptions) {
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
          createRepoLabel,
          ccolors.error(
            "'gh' CLI must be installed and added to PATH when using",
          ),
          ccolors.key_name("cndi init --create"),
          ccolors.error('or'),
          ccolors.key_name("cndi create"),
        ].join(" "),
        { cause: 1300 },
      );
    }
  }

  const envPath = path.join(options.output, ".env");

  await loadEnv({
    envPath,
    export: true,
  });

  const repoUrlString = Deno.env.get("GIT_REPO")!;
  const GIT_TOKEN = Deno.env.get("GIT_TOKEN")!;
  const GIT_USERNAME = Deno.env.get("GIT_USERNAME")!;

  try {
    repoUrl = new URL(repoUrlString);
  } catch (error) {
    console.error(
      createRepoLabel,
      ccolors.error(
        `Could not parse the provided 'GIT_REPO' url as a valid URL`,
      ),
      ccolors.caught(error, 1301),
    );
    await emitExitEvent(1301);
    Deno.exit(1301);
  }

  const git = simpleGit(options.output);

  repoUrl.username = GIT_USERNAME;
  repoUrl.password = GIT_TOKEN;

  const repoUrlStringWithCredentials = repoUrl.toString();

  try {
    await git.init();
  } catch (e) {
    console.error(e);
    console.error("git init failed");
  }

  try {
    await git.addRemote("origin", repoUrlStringWithCredentials);
  } catch (e) {
    console.error(e);
    console.error(
      ccolors.warn("git remote add origin"),
      ccolors.error("failed"),
    );
  }

  try {
    await git.add(".");
  } catch (e) {
    console.error(e);
    console.error(ccolors.warn("git add"), ccolors.error("failed"));
  }

  try {
    await git.commit("initial commit");
  } catch (e) {
    console.error(e);
    console.error(
      ccolors.warn("git commit -m 'initial commit'"),
      ccolors.error("failed"),
    );
  }

  const createRepoCmd = new Deno.Command("gh", {
    args: [
      "repo",
      "create",
      repoUrlStringWithCredentials,
      "--private",
    ],
    env: {
      GH_TOKEN: GIT_TOKEN,
    },
    cwd: options.output,
  });

  try {
    const createRepoOutput = await createRepoCmd.output();
    if (createRepoOutput.code !== 0) {
      await writeAll(Deno.stderr, createRepoOutput.stderr);
      console.error(createRepoLabel, ccolors.error("failed to create repo"));
    }
  } catch (e) {
    console.error("failed to create repo");
    console.error(e);
  }

  const setSecretCmd = new Deno.Command("gh", {
    args: [
      "secret",
      "set",
      "-f",
      envPath,
      repoUrlStringWithCredentials,
    ],
    env: {
      GH_TOKEN: GIT_TOKEN,
    },
    cwd: options.output,
  });

  let setSecretOutputCode = 1;

  while (setSecretOutputCode !== 0) {
    try {
      const setSecretOutput = await setSecretCmd.output();
      setSecretOutputCode = setSecretOutput.code; // break loop if successful
      // writing logs is not helpful for GitHub Secrets
      // await writeAll(Deno.stdout, setSecretOutput.stdout);
      // await writeAll(Deno.stderr, setSecretOutput.stderr);
    } catch (e) {
      console.error("failed to set GitHub Secrets");
      console.error(e);
    }
  }

  if (!options?.skipPush) {
    try {
      await git.push("origin", "main", ["--set-upstream"]);
    } catch (e) {
      console.error(e);
      console.error(
        ccolors.warn("git push origin main"),
        ccolors.error("failed"),
      );
    }
    console.log(
      ccolors.success(
        `created cndi cluster repo at`,
      ),
      ccolors.key_name(`${repoUrlString}`),
    );
  }
}
