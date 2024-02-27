import { ccolors, path, simpleGit } from "deps";

import encrypt from "src/tfstate/encrypt.ts";

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
    throw new Error(
      [
        gitWriteStateLabel,
        ccolors.user_input(`"${cmd}"`),
        ccolors.error("must be executed inside a git repository"),
      ].join(" "),
      { cause: 1005 },
    );
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    throw new Error(
      [
        gitWriteStateLabel,
        ccolors.error("you must have clean git state when running"),
        ccolors.user_input(`"${cmd}"`),
      ].join(" "),
      { cause: 1006 },
    );
  }

  await git.raw("config", "user.email", "bot@cndi.run"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  const originalBranch = (await git.branch()).current;

  const pathToState = path.join(pathToTerraformResources, "terraform.tfstate");
  let state: string;

  try {
    state = Deno.readTextFileSync(pathToState);
  } catch (errorReadingState) {
    if (errorReadingState instanceof Deno.errors.NotFound) {
      throw new Error(
        [
          gitWriteStateLabel,
          ccolors.error("failed to find tfstate at"),
          ccolors.key_name(`"${pathToState}"`),
        ].join(" "),
        { cause: 1009 },
      );
    }
  }

  try {
    // this should throw an error if state is corrupted
    JSON.parse(state!);
  } catch {
    throw new Error(
      [
        gitWriteStateLabel,
        ccolors.error("corrupted state JSON please run"),
        ccolors.user_input(`"${cmd}"`),
        ccolors.error("again"),
      ].join(" "),
      { cause: 1007 },
    );
  }

  const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

  if (!secret) {
    throw new Error(
      [
        gitWriteStateLabel,
        ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
        "is not set in your environment",
      ].join(" "),
      { cause: 1008 },
    );
  }

  try {
    await git.checkout({ "--orphan": "_state" });
  } catch {
    await git.fetch();
    await git.checkout("_state");
  }

  const encryptedState = encrypt(state!, secret);

  const pathToNewState = path.join(
    pathToTerraformResources,
    "terraform.tfstate.encrypted",
  );

  // console.log("encrypted state!");

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
    await git.raw("add", pathToNewState, "--force"); // add the file regardless of if it is in .gitignore
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
