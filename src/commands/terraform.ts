import { copy } from "https://deno.land/std@0.173.0/streams/mod.ts";
import { CNDIContext } from "../types.ts";
import setTF_VARs from "../setTF_VARs.ts";
import pullStateForRun from "../tfstate/git/read-state.ts";
import pushStateFromRun from "../tfstate/git/write-state.ts";
/**
 * COMMAND fn: cndi terraform
 * Wraps the terraform cli with a CNDI context
 */
export default async function terraform(
  { pathToTerraformBinary, pathToTerraformResources }: CNDIContext,
  args: string[],
) {
  console.log("cndi terraform", args.join(" "), "\n");

  setTF_VARs(); // set TF_VARs using CNDI's .env variables

  await pullStateForRun(pathToTerraformResources);

  const ranProxiedTerraformCmd = Deno.run({
    cmd: [pathToTerraformBinary, `-chdir=${pathToTerraformResources}`, ...args],
    stderr: "piped",
    stdout: "piped",
  });

  copy(ranProxiedTerraformCmd.stdout, Deno.stdout);
  copy(ranProxiedTerraformCmd.stderr, Deno.stderr);

  const proxiedTerraformCmdStatus = await ranProxiedTerraformCmd.status();

  await pushStateFromRun(pathToTerraformResources);

  if (proxiedTerraformCmdStatus.code !== 0) {
    Deno.exit(proxiedTerraformCmdStatus.code); // arbitrary exit code
  }

  ranProxiedTerraformCmd.close();
}
