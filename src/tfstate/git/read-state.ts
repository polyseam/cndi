import { ccolors, path, simpleGit } from "deps";

import decrypt from "src/tfstate/decrypt.ts";

const git = simpleGit();

import { ErrOut } from "errout";

const label = ccolors.faded("src/tfstate/git/read-state.ts:");

type PullStateForRunOptions = {
  pathToTerraformResources: string;
  cmd: string;
};

export async function pullStateForTerraform({
  pathToTerraformResources,
  cmd,
}: PullStateForRunOptions): Promise<ErrOut | void> {
  // fails in GitHub Actions
  const isGitRepo = git.checkIsRepo();

  if (!isGitRepo) {
    return new ErrOut(
      [
        ccolors.user_input(`"${cmd}"`),
        ccolors.error("must be executed inside a git repository"),
      ],
      {
        code: 1001,
        label,
        id: "read-state/!isGitRepo",
        metadata: {
          cmd,
        },
      },
    );
  }

  await git.raw("config", "user.email", "bot@cndi.dev"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  await git.fetch();

  const originalBranch = (await git.branch()).current;

  if (!originalBranch) {
    return new ErrOut(
      [
        ccolors.error("you must make a commit on your branch before running"),
        ccolors.user_input(`"${cmd}"`),
      ],
      {
        code: 1002,
        label,
        id: "read-state/current-branch/!commits.length",
        metadata: { cmd },
      },
    );
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    return new ErrOut(
      [
        ccolors.error("your branch must be clean before running"),
        ccolors.user_input(`"${cmd}"`),
      ],
      {
        code: 1003,
        label,
        id: "read-state/cleanGitState/!isClean",
        metadata: { cmd, originalBranch },
      },
    );
  }

  try {
    // create new _state branch
    await git.checkout("_state");
  } catch {
    // checkout existing _state branch
    await git.raw("switch", "--orphan", "_state");
  }

  // pull the latest changes from _state branch
  // (required in environments where _state is persisted)
  // eg. cndi show-outputs locally
  try {
    await git.pull("origin", "_state");
  } catch (errorPullingState) {
    if (errorPullingState instanceof Error) {
      return new ErrOut(
        [
          ccolors.error("failed to pull state from _state branch"),
          ccolors.error("likely because you have no _state branch"),
          ccolors.error("or your _state branch is not up to date"),
        ],
        {
          code: 1005,
          label,
          id: "read-state/pull-state/!pull",
          metadata: { cmd, originalBranch },
        },
      );
    }
  }

  let state;

  try {
    state = await Deno.readTextFile(
      path.join(pathToTerraformResources, "terraform.tfstate.encrypted"),
    );
  } catch {
    console.log(
      label,
      `"terraform.tfstate.encrypted" not found, using fresh state`,
    );
  }

  const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

  if (!secret) {
    return new ErrOut(
      [
        ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
        "is not set in your environment",
      ],
      {
        code: 1004,
        label,
        id: "read-state/!env.TERRAFORM_STATE_PASSPHRASE",
      },
    );
  }

  await git.checkout(originalBranch);

  if (state) {
    const decryptedState = await decrypt(state, secret);
    await Deno.writeTextFile(
      path.join(pathToTerraformResources, "terraform.tfstate"),
      decryptedState,
    );
  }
}
