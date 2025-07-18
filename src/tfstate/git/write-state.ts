import { ccolors, path, simpleGit } from "deps";

import encrypt from "src/tfstate/encrypt.ts";
import { ErrOut } from "errout";

const git = simpleGit();

const label = ccolors.faded("\nsrc/tfstate/git/write-state.ts:");
type PushStateForRunOptions = {
  pathToTerraformResources: string;
  cmd: string;
};

export async function pushStateFromTerraform({
  pathToTerraformResources,
  cmd,
}: PushStateForRunOptions): Promise<ErrOut | void> {
  const isGitRepo = await git.checkIsRepo();

  if (!isGitRepo) {
    return new ErrOut(
      [
        ccolors.user_input(`"${cmd}"`),
        ccolors.error("must be executed inside a git repository"),
      ],
      { code: 1005, label, id: "write-state/!isGitRepo", metadata: { cmd } },
    );
  }

  // we can't have any uncommitted changes
  const cleanGitState = (await git.status()).isClean();

  if (!cleanGitState) {
    return new ErrOut(
      [
        ccolors.error("you must have clean git state when running"),
        ccolors.user_input(`"${cmd}"`),
      ],
      {
        code: 1006,
        label,
        id: "write-state/!cleanGitState",
        metadata: { cmd },
      },
    );
  }

  await git.raw("config", "user.email", "bot@cndi.run"); // this is needed for git to work
  await git.raw("config", "user.name", Deno.env.get("GIT_USERNAME") || "cndi");

  const originalBranch = (await git.branch()).current;

  const pathToState = path.join(pathToTerraformResources, "terraform.tfstate");
  let state: string;

  try {
    state = await Deno.readTextFile(pathToState);
  } catch (errorReadingState) {
    if (errorReadingState instanceof Deno.errors.NotFound) {
      return new ErrOut(
        [
          ccolors.error("failed to find tfstate at"),
          ccolors.key_name(`"${pathToState}"`),
        ],
        {
          code: 1009,
          id: "write-state/!stateFile",
          label,
          metadata: { cmd, pathToState },
        },
      );
    }
  }

  try {
    // this should throw an error if state is corrupted
    JSON.parse(state!);
  } catch {
    return new ErrOut(
      [
        ccolors.error("corrupted state JSON please run"),
        ccolors.user_input(`"${cmd}"`),
        ccolors.error("again"),
      ],
      {
        code: 1007,
        id: "write-state/!parseAsJSON(stateFile)",
        label,
        metadata: { cmd, pathToState, state: state! },
      },
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
        code: 1008,
        id: "write-state/!env.TERRAFORM_STATE_PASSPHRASE",
        label,
        metadata: { cmd, secret },
      },
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

  try {
    await Deno.writeTextFile(pathToNewState, encryptedState);
  } catch (errorWritingState) {
    console.error(
      label,
      ccolors.error("failed to write encrypted tfstate to disk"),
    );
    console.error(ccolors.caught(errorWritingState as Error));
  }

  try {
    await git.raw("add", pathToNewState, "--force"); // add the file regardless of if it is in .gitignore
    await git.commit(
      `automated commit from "${cmd}": ${Math.floor(Date.now() / 1000)}`,
      [pathToNewState],
    );
  } catch (errorCommitingState) {
    console.error(
      label,
      ccolors.error(`failed to commit encrypted tfstate`),
      ccolors.key_name(`"_state"`),
      ccolors.error(`branch`),
    );
    console.error(ccolors.caught(errorCommitingState as Error));
  }

  try {
    await git.push("origin", "_state", { "--force": null });
  } catch (pushError) {
    console.error(
      label,
      ccolors.error(`failed to push encrypted`),
      ccolors.key_name(`terraform.tfstate`),
      ccolors.error(`to remote`),
      ccolors.key_name(`"_state"`),
      ccolors.error(`branch`),
    );
    console.error('did you forget to add an "origin" remote?');
    console.error(ccolors.caught(pushError as Error));
  }

  await git.checkout(originalBranch || "main");
}
