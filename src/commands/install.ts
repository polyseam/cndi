import { Command } from "deps";
import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "constants";
import install from "src/install.ts";

/**
 * COMMAND cndi install
 * Installs CNDI dependencies to CNDI_HOME
 */
const installCommand = new Command()
  .description(`Install cndi dependencies.`)
  .hidden()
  .action(async () => {
    const CNDI_HOME = Deno.env.get("CNDI_HOME")!;
    await install({ KUBESEAL_VERSION, TERRAFORM_VERSION, CNDI_HOME }, true);
  });

export default installCommand;
