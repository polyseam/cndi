import { colors, path, simpleGit } from "deps";

import encrypt from "src/tfstate/encrypt.ts";

const git = simpleGit();

const gitWriteStateLabel = colors.white("\nsrc/tfstate/git/write-state:");

export default async function pushStateFromRun({
  pathToTerraformResources,
  cmd,
}: {
  pathToTerraformResources: string;
  cmd: string;
}) {
  const isGitRepo = await git.checkIsRepo();

  if (!isGitRepo) {
    console.log(
      gitWriteStateLabel,
      `"${cmd}" must be executed inside a git repository`,
    );
    Deno.exit(1);
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    console.log(
      gitWriteStateLabel,
      colors.brightRed("your branch must be clean before running"),
      `"${colors.cyan(cmd)}"\n`,
    );
    Deno.exit(1);
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
    Deno.exit(1);
  }

  const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

  if (!secret) {
    console.log(
      gitWriteStateLabel,
      colors.yellow("TERRAFORM_STATE_PASSPHRASE"),
      "is not set in your environment file",
    );
    Deno.exit(1);
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
  } catch {
    console.log(
      gitWriteStateLabel,
      "failed to write encrypted tfstate to disk",
    );
  }
  try {
    await git.raw("add", pathToNewState, "--force");
    await git.commit(
      `automated commit from "${cmd}": ${Math.floor(Date.now() / 1000)}`,
      [pathToNewState],
    );
  } catch (e) {
    console.log(
      gitWriteStateLabel,
      `failed to commit encrypted tfstate to "_state" branch`,
    );
    console.log(e);
  }

  try {
    await git.push("origin", "_state", { "--force": null });
  } catch (pushError) {
    console.log(
      gitWriteStateLabel,
      `failed to push encrypted terraform.tfstate to remote "_state" branch`,
    );
    console.log('did you forget to add an "origin" remote?');
    console.log(pushError);
  }

  await git.checkout(originalBranch || "main");
}
