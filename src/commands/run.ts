import "https://deno.land/std@0.172.0/dotenv/load.ts";
import { copy } from "https://deno.land/std@0.172.0/streams/copy.ts";

import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";

import { brightRed, white } from "https://deno.land/std@0.172.0/fmt/colors.ts";
import setTF_VARs from "../setTF_VARs.ts";
import { CNDIContext } from "../types.ts";

const runLabel = white("run:");

/**
 * COMMAND fn: cndi run
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const runFn = async ({
  pathToTerraformBinary,
  pathToTerraformResources,
}: CNDIContext) => {
  console.log("cndi run\n");
  try {
    setTF_VARs(); // set TF_VARs using CNDI's .env variables

    await pullStateForRun(pathToTerraformResources);

    // terraform.tfstate will be in this folder after the first run
    const ranTerraformInit = Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "init",
      ],
      stderr: "piped",
      stdout: "piped",
    });

    copy(ranTerraformInit.stdout, Deno.stdout);
    copy(ranTerraformInit.stderr, Deno.stderr);

    const initStatus = await ranTerraformInit.status();

    if (initStatus.code !== 0) {
      console.log(runLabel, brightRed("terraform init failed"));
      Deno.exit(1);
    }

    ranTerraformInit.close();

    const ranTerraformApply = Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "apply",
        "-auto-approve",
      ],
      stderr: "piped",
      stdout: "piped",
    });

    copy(ranTerraformApply.stdout, Deno.stdout);
    copy(ranTerraformApply.stderr, Deno.stderr);

    const applyStatus = await ranTerraformApply.status();

    await pushStateFromRun(pathToTerraformResources);

    // if `terraform apply` fails, exit the process and swallow the error
    if (applyStatus.code !== 0) {
      Deno.exit(1); // if we failed here we wouldn't be able to persist state to "_state" branch
    }

    ranTerraformApply.close();
  } catch (err) {
    console.log(runLabel, brightRed("unhandled error"), err);
  }
};

export default runFn;
