import "https://deno.land/std@0.157.0/dotenv/load.ts";
import { CNDIContext } from "../types.ts";

/**
 * COMMAND fn: cndi run
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const runFn = async ({
  pathToTerraformBinary,
  pathToTerraformResources,
}: CNDIContext) => {
  console.log("cndi run");
  try {
    // terraform.tfstate will be in this folder after the first run
    const ranTerraformInit = await Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "init",
      ],
      "stderr": "piped",
      "stdout": "piped",
    });

    const initStatus = await ranTerraformInit.status();
    const initOutput = await ranTerraformInit.output();
    const initStderr = await ranTerraformInit.stderrOutput();

    if (initStatus.code !== 0) {
      Deno.stdout.write(initStderr);
      Deno.exit(251); // arbitrary exit code
    } else {
      Deno.stdout.write(initOutput);
    }

    ranTerraformInit.close();


    const ranTerraformApply = await Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "apply",
        "-auto-approve",
      ],
      "stderr": "piped",
      "stdout": "piped",
    });

    const applyStatus = await ranTerraformApply.status();
    const applyOutput = await ranTerraformApply.output();
    const applyStderr = await ranTerraformApply.stderrOutput();

    if (applyStatus.code !== 0) {
      Deno.stdout.write(applyStderr);
      Deno.exit(252); // arbitrary exit code
    } else {
      Deno.stdout.write(applyOutput);
    }

    ranTerraformApply.close();

  } catch (err) {
    console.log('error in "cndi run"');
    console.error(err);
  }
};

export default runFn;
