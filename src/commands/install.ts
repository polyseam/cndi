import { Command } from "deps";
/**
 * COMMAND cndi install
 * Installs CNDI dependencies to CNDI_HOME
 */
const installCommand = new Command()
  .description(`DEPRECATED: Install cndi dependencies.`)
  .hidden()
  .action(async () => {
    // TODO: remove this command
    // cndi install is no longer required
    // dependencies are included in the tarball
  });

export default installCommand;
