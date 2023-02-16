import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "../deps.ts";
import install from "../install.ts";

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
