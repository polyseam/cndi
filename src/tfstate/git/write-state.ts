import { ccolors, path, simpleGit } from "deps";

import encrypt from "src/tfstate/encrypt.ts";
import { emitExitEvent } from "src/utils.ts";

const git = simpleGit();

const gitWriteStateLabel = ccolors.faded("\nsrc/tfstate/git/write-state.ts:");

export default async function pushStateFromRun({
  pathToTerraformResources,
  cmd,
}: {
  pathToTerraformResources: string;
  cmd: string;
}) {
  const isGitRepo = await git.checkIsRepo();

  if (!isGitRepo) {
    console.error(
      gitWriteStateLabel,
      ccolors.user_input(`"${cmd}"`),
      ccolors.error("must be executed inside a git repository"),
    );
    await emitExitEvent(1005);
    Deno.exit(1005);
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    console.error(
      gitWriteStateLabel,
      ccolors.error("you must have clean git state when running"),
      ccolors.user_input(`"${cmd}"`),
    );
    await emitExitEvent(1006);
    Deno.exit(1006);
  }

  await git.raw("config", "user.email", "bot@cndi.run"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  const originalBranch = (await git.branch()).current;

  const pathToState = path.join(pathToTerraformResources, "terraform.tfstate");

  const state = Deno.readTextFileSync(pathToState);

  try {
    // this should throw an error if state is corrupted
    JSON.parse(state);
  } catch {
    console.log(
      gitWriteStateLabel,
      `corrupted state, please run "${cmd}" again`,
    );
    await emitExitEvent(1007);
    Deno.exit(1007);
  }

  const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

  if (!secret) {
    console.error(
      gitWriteStateLabel,
      ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
      "is not set in your environment",
    );
    await emitExitEvent(1008);
    Deno.exit(1008);
  }

  try {
    await git.checkout({ "--orphan": "_state" });
  } catch {
    await git.checkout("_state");
  }

  const encryptedState = encrypt(state, secret);

  const pathToNewState = path.join(
    pathToTerraformResources,
    "terraform.tfstate.encrypted",
  );

  try {
    Deno.writeTextFileSync(pathToNewState, encryptedState);
  } catch (errorWritingState) {
    console.error(
      gitWriteStateLabel,
      ccolors.error("failed to write encrypted tfstate to disk"),
    );
    console.log(ccolors.caught(errorWritingState));
  }
  try {
    await git.raw("add", pathToNewState, "--force");
    await git.commit(
      `automated commit from "${cmd}": ${Math.floor(Date.now() / 1000)}`,
      [pathToNewState],
    );
  } catch (errorCommitingState) {
    console.error(
      gitWriteStateLabel,
      ccolors.error(`failed to commit encrypted tfstate`),
      ccolors.key_name(`"_state"`),
      ccolors.error(`branch`),
    );
    console.log(ccolors.caught(errorCommitingState));
  }

  try {
    await git.push("origin", "_state", { "--force": null });
  } catch (pushError) {
    console.error(
      gitWriteStateLabel,
      ccolors.error(`failed to push encrypted`),
      ccolors.key_name(`terraform.tfstate`),
      ccolors.error(`to remote`),
      ccolors.key_name(`"_state"`),
      ccolors.error(`branch`),
    );
    console.log('did you forget to add an "origin" remote?');
    console.log(ccolors.caught(pushError));
  }

  await git.checkout(originalBranch || "main");
}
