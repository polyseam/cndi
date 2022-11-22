import "https://deno.land/std@0.157.0/dotenv/load.ts";
import { brightRed, white } from "https://deno.land/std@0.157.0/fmt/colors.ts";
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

    // terraform.tfstate will be in this folder after the first run
    const ranTerraformInit = await Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "init",
      ],
      stderr: "piped",
      stdout: "piped",
    });

    const initStatus = await ranTerraformInit.status();
    const initOutput = await ranTerraformInit.output();
    const initStderr = await ranTerraformInit.stderrOutput();

    if (initStatus.code !== 0) {
      console.log(runLabel, brightRed("terraform init failed"));
      await Deno.stdout.write(initStderr);
      Deno.exit(1); // arbitrary exit code
    } else {
      await Deno.stdout.write(initOutput);
    }

    ranTerraformInit.close();

    const ranTerraformApply = await Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        "apply",
        "-auto-approve",
      ],
      stderr: "piped",
      stdout: "piped",
    });

    const applyStatus = await ranTerraformApply.status();
    const applyOutput = await ranTerraformApply.output();
    const applyStderr = await ranTerraformApply.stderrOutput();

    if (applyStatus.code !== 0) {
      console.log(runLabel, brightRed("terraform apply failed"));
      await Deno.stdout.write(applyStderr);
      Deno.exit(1); // arbitrary exit code
    } else {
      await Deno.stdout.write(applyOutput);
    }

    ranTerraformApply.close();
  } catch (err) {
    console.log(runLabel, brightRed("unhandled error"), err);
  }
};

export default runFn;
