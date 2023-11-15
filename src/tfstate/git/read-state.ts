import { ccolors, path, simpleGit } from "deps";

import decrypt from "src/tfstate/decrypt.ts";
import { emitExitEvent, getPrettyJSONString } from "src/utils.ts";

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
    console.error(
      gitReadStateLabel,
      ccolors.user_input(`"${cmd}"`),
      ccolors.error("must be executed inside a git repository"),
    );
    await emitExitEvent(1001);
    Deno.exit(1001);
  }

  await git.raw("config", "user.email", "bot@cndi.run"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  await git.fetch();

  const originalBranch = (await git.branch()).current;

  if (!originalBranch) {
    console.error(
      gitReadStateLabel,
      ccolors.error("you must make a commit on your branch before running"),
      ccolors.user_input(`"${cmd}"`),
    );
    await emitExitEvent(1002);
    Deno.exit(1002);
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    console.error(
      gitReadStateLabel,
      ccolors.error("your branch must be clean before running"),
      ccolors.user_input(`"${cmd}"`),
    );
    await emitExitEvent(1003);
    Deno.exit(1003);
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
    console.error(
      gitReadStateLabel,
      ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
      "is not set in your environment",
    );
    await emitExitEvent(1004);
    Deno.exit(1004);
  }

  await git.checkout(originalBranch);

  if (state) {
    const decryptedState = await decrypt(state, secret);
    try {
      console.log(ccolors.key_name("--- decrypted terraform.tfstate ---:"));
      console.log(getPrettyJSONString(decryptedState));
      console.log(
        ccolors.key_name("--- writing decrypted terraform.tfstate ---:"),
      );
      Deno.writeTextFileSync(
        path.join(pathToTerraformResources, "terraform.tfstate"),
        decryptedState,
      );
    } catch (error) {
      console.log("error in reading state to workspace:");
      console.log(error);
    }
  }
}
