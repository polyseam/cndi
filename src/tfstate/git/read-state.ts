import { ccolors, path, simpleGit } from "deps";

import decrypt from "src/tfstate/decrypt.ts";

const git = simpleGit();

const gitReadStateLabel = ccolors.faded("src/tfstate/git/read-state.ts:");

export default async function pullStateForRun({
  pathToTerraformResources,
  cmd,
}: {
  pathToTerraformResources: string;
  cmd: string;
}) {
  // fails in GitHub Actions
  const isGitRepo = git.checkIsRepo();

  if (!isGitRepo) {
    throw new Error(
      [
        gitReadStateLabel,
        ccolors.user_input(`"${cmd}"`),
        ccolors.error("must be executed inside a git repository"),
      ].join(" "),
      { cause: 1001 },
    );
  }

  await git.raw("config", "user.email", "bot@cndi.dev"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  await git.fetch();

  const originalBranch = (await git.branch()).current;

  if (!originalBranch) {
    throw new Error(
      [
        gitReadStateLabel,
        ccolors.error("you must make a commit on your branch before running"),
        ccolors.user_input(`"${cmd}"`),
      ].join(" "),
      { cause: 1002 },
    );
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    throw new Error(
      [
        gitReadStateLabel,
        ccolors.error("your branch must be clean before running"),
        ccolors.user_input(`"${cmd}"`),
      ].join(" "),
      { cause: 1003 },
    );
  }

  try {
    // create new _state branch
    await git.checkout("_state");
  } catch {
    // checkout existing _state branch
    await git.raw("switch", "--orphan", "_state");
  }

  let state;

  try {
    state = Deno.readTextFileSync(
      path.join(pathToTerraformResources, "terraform.tfstate.encrypted"),
    );
  } catch {
    console.log(
      gitReadStateLabel,
      `"terraform.tfstate.encrypted" not found, using fresh state`,
    );
  }

  const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

  if (!secret) {
    throw new Error(
      [
        gitReadStateLabel,
        ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
        "is not set in your environment",
      ].join(" "),
      {
        cause: 1004,
      },
    );
  }

  await git.checkout(originalBranch);

  if (state) {
    const decryptedState = await decrypt(state, secret);
    Deno.writeTextFileSync(
      path.join(pathToTerraformResources, "terraform.tfstate"),
      decryptedState,
    );
  }
}
