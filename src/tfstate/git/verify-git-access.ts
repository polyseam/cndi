import { white } from "https://deno.land/std@0.157.0/fmt/colors.ts";
import { simpleGit } from "npm:simple-git";

const git = simpleGit();

const verifyGitAccessLabel = white("tfstate/git/verify-git-access:");

export default async function verifyGitAccess() {
  const isGitRepo = await git.checkIsRepo();

  if (!isGitRepo) {
    console.log(
      verifyGitAccessLabel,
      '"cndi run" must be executed inside a git repository',
    );
    Deno.exit(1);
  }

  const _fetched = await git.fetch();
  const branchNames = (await git.branch()).all;

  if (!branchNames.includes("_state")) {
    // create state branch
    await git.checkoutBranch("_state", "origin/main");
  } else {
    // checkout state branch
    await git.checkout("_state");
  }
}

verifyGitAccess();
