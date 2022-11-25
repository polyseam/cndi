import { CNDIContext } from "../types.ts";
import setTF_VARs from "../setTF_VARs.ts";
import { copy } from "https://deno.land/std@0.166.0/streams/conversion.ts";

/**
 * COMMAND fn: cndi terraform
 * Wraps the terraform cli with a CNDI context
 */
export default async function terraform(
  { pathToTerraformBinary, pathToTerraformResources }: CNDIContext,
  args: string[],
) {
  console.log("cndi terraform", args.join(" "));

  setTF_VARs(); // set TF_VARs using CNDI's .env variables

  const ranProxiedTerraformCmd = Deno.run({
    cmd: [pathToTerraformBinary, `-chdir=${pathToTerraformResources}`, ...args],
    "stderr": "piped",
    "stdout": "piped",
  });

  copy(ranProxiedTerraformCmd.stdout, Deno.stdout);
  copy(ranProxiedTerraformCmd.stderr, Deno.stderr);

  const proxiedTerraformCmdStatus = await ranProxiedTerraformCmd.status();
  const proxiedTerraformCmdOutput = await ranProxiedTerraformCmd.output();
  const proxiedTerraformCmdStderr = await ranProxiedTerraformCmd.stderrOutput();

  if (proxiedTerraformCmdStatus.code !== 0) {
    await Deno.stdout.write(proxiedTerraformCmdStderr);
    Deno.exit(253); // arbitrary exit code
  } else {
    await Deno.stdout.write(proxiedTerraformCmdOutput);
  }

  ranProxiedTerraformCmd.close();
}
