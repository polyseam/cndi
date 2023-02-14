import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

import * as path from "https://deno.land/std@0.173.0/path/mod.ts";

import { simpleGit } from "../../deps.ts";

import decrypt from "../decrypt.ts";

const git = simpleGit();

const gitReadStateLabel = colors.white("tfstate/git/read-state:");

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
    console.log(
      gitReadStateLabel,
      `"${cmd}" must be executed inside a git repository`,
    );
    Deno.exit(1);
  }

  await git.raw("config", "user.email", "bot@cndi.run"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  await git.fetch();

  const originalBranch = (await git.branch()).current;

  if (!originalBranch) {
    console.log(
      gitReadStateLabel,
      "you must make a commit on your branch before running",
      `"${colors.cyan(cmd)}"\n`,
    );
    Deno.exit(1);
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    console.log(
      gitReadStateLabel,
      colors.brightRed("your branch must be clean before running"),
      `"${colors.cyan(cmd)}"\n`,
    );
    Deno.exit(1);
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
    console.log(
      gitReadStateLabel,
      colors.yellow("TERRAFORM_STATE_PASSPHRASE"),
      "is not set in your environment file",
    );
    Deno.exit(1);
  }

  await git.checkout(originalBranch);

  if (state) {
    const decryptedState = decrypt(state, secret);
    Deno.writeTextFileSync(
      path.join(pathToTerraformResources, "terraform.tfstate"),
      decryptedState,
    );
  }
}
