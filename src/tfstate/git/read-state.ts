import {
  cyan,
  white,
  yellow,
} from "https://deno.land/std@0.172.0/fmt/colors.ts";

import * as path from "https://deno.land/std@0.172.0/path/mod.ts";

import { simpleGit } from "https://esm.sh/simple-git@3.15.1?no-dts&target=deno&deno-std=0.172.0&bundle&deps=@kwsites/file-exists@1.1.1";

import decrypt from "../decrypt.ts";

const git = simpleGit();

const gitReadStateLabel = white("tfstate/git/read-state:");

export default async function pullStateForRun(
  pathToTerraformResources: string
) {
  // fails in GitHub Actions
  const isGitRepo = git.checkIsRepo();

  if (!isGitRepo) {
    console.log(
      gitReadStateLabel,
      '"cndi run" must be executed inside a git repository'
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
      cyan("cndi run\n")
    );
    Deno.exit(1);
  }

  try {
    await git.raw("switch", "--orphan", "_state");
  } catch {
    await git.checkout("_state");
  }

  let state;

  try {
    state = Deno.readTextFileSync(
      path.join(pathToTerraformResources, "terraform.tfstate.encrypted")
    );
  } catch {
    console.log(
      gitReadStateLabel,
      "'terraform.tfstate.encrypted' not found, using fresh state"
    );
  }

  const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

  if (!secret) {
    console.log(
      gitReadStateLabel,
      yellow("TERRAFORM_STATE_PASSPHRASE"),
      "is not set in your environment file"
    );
    Deno.exit(1);
  }

  await git.checkout(originalBranch);

  if (state) {
    const decryptedState = decrypt(state, secret);
    Deno.writeTextFileSync(
      path.join(pathToTerraformResources, "terraform.tfstate"),
      decryptedState
    );
  }
}
