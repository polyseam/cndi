import "https://deno.land/std@0.173.0/dotenv/load.ts";
import { copy } from "https://deno.land/std@0.173.0/streams/copy.ts";

import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";

import { brightRed, white } from "https://deno.land/std@0.173.0/fmt/colors.ts";
import setTF_VARs from "../setTF_VARs.ts";
import { CNDIContext } from "../types.ts";

const destroyLabel = white("destroy:");

/**
 * COMMAND fn: cndi destroy
 * Destroys the CNDI cluster that was created with this repo
 */
const destroyFn = async ({
  pathToTerraformBinary,
  pathToTerraformResources,
}: CNDIContext) => {
  const cmd = "cndi destroy";
  console.log(`${cmd}\n`);
  try {
    setTF_VARs(); // set TF_VARs using CNDI's .env variables

    await pullStateForRun({ pathToTerraformResources, cmd });

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
      console.log(destroyLabel, brightRed("terraform init failed"));
      Deno.exit(initStatus.code);
    }

    ranTerraformInit.close();

    const ranTerraformDestroy = Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "destroy",
        // "-auto-approve" is an option, but I don't think we want it for destroy calls
      ],
      stderr: "piped",
      stdout: "piped",
    });

    copy(ranTerraformDestroy.stdout, Deno.stdout);
    copy(ranTerraformDestroy.stderr, Deno.stderr);

    const destroyStatus = await ranTerraformDestroy.status();

    await pushStateFromRun({ pathToTerraformResources, cmd });

    // if `terraform destroy` fails, exit with the code
    if (destroyStatus.code !== 0) {
      Deno.exit(destroyStatus.code);
    }

    ranTerraformDestroy.close();
  } catch (err) {
    console.log(destroyLabel, brightRed("unhandled error"), err);
  }
};

export default destroyFn;
