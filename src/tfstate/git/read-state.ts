import { white, yellow } from "https://deno.land/std@0.157.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { simpleGit } from "npm:simple-git";
import { CNDIContext } from "../../types.ts";
import decrypt from "../decrypt.ts";

const git = simpleGit();

const gitReadStateLabel = white("tfstate/git/read-state:");

export default async function pullStateForRun(
  pathToTerraformResources: string
) {
  const isGitRepo = await git.checkIsRepo();

  if (!isGitRepo) {
    console.log(
      gitReadStateLabel,
      '"cndi run" must be executed inside a git repository'
    );
    Deno.exit(1);
  }

  const _fetched = await git.fetch();
  const originalBranch = (await git.branch()).current;

  const branchNames = (await git.branch()).all;

  try {
    await git.checkout({ "--orphan": "_state" });
  } catch {
    await git.checkoutLocalBranch("_state");
  }

  try {
    const state = Deno.readTextFileSync(
      "./cndi/terraform/terraform.tfstate.encrypted"
    );

    const secret = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

    if (!secret) {
      console.log(
        gitReadStateLabel,
        yellow("TERRAFORM_STATE_PASSPHRASE"),
        "is not set in your environment file"
      );
      Deno.exit(1);
    }

    const decryptedState = decrypt(state, secret);
    await git.checkoutLocalBranch(originalBranch);
    Deno.writeTextFileSync(
      path.join(pathToTerraformResources, "terraform.tfstate"),
      decryptedState
    );
  } catch {
    console.log(
      gitReadStateLabel,
      "no 'terraform.tfstate.encrypted' found, using fresh state"
    );
  }
}
