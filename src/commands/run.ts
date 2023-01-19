import "https://deno.land/std@0.173.0/dotenv/load.ts";
import { copy } from "https://deno.land/std@0.173.0/streams/copy.ts";

import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";

import { brightRed, white } from "https://deno.land/std@0.173.0/fmt/colors.ts";
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
  const cmd = "cndi run";
  console.log(`${cmd}\n`);
  try {
    setTF_VARs(); // set TF_VARs using CNDI's .env variables

    await pullStateForRun({ pathToTerraformResources, cmd });

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
      Deno.exit(initStatus.code);
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

    await pushStateFromRun({ pathToTerraformResources, cmd });

    // if `terraform apply` fails, exit with the code
    if (applyStatus.code !== 0) {
      Deno.exit(applyStatus.code);
    }

    ranTerraformApply.close();
  } catch (err) {
    console.log(runLabel, brightRed("unhandled error"), err);
  }
};

export default runFn;
