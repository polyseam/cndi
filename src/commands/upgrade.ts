import {
  GHRError,
  GithubReleasesProvider,
  GithubReleasesUpgradeCommand,
} from "deps";

import { emitExitEvent, getPathToCndiBinary } from "src/utils.ts";

const destinationDir = "~/.cndi/bin";

const upgradeCommand = new GithubReleasesUpgradeCommand({
  provider: new GithubReleasesProvider({
    repository: "polyseam/cndi",
    destinationDir,
    osAssetMap: {
      windows: "cndi-win.tar.gz",
      linux: "cndi-linux.tar.gz",
      darwin: "cndi-mac.tar.gz",
    },
    onError: async (error: GHRError) => {
      const exit_code = parseInt(`11${error.code}`);
      await emitExitEvent(exit_code);
      Deno.exit(exit_code);
    },
    onComplete: async (_metadata, printSuccessMessage) => {
      const pathToCndiBinary = getPathToCndiBinary();
      // preheat binary before logging success message
      const cmd = new Deno.Command(pathToCndiBinary, { args: ["--help"] });
      await cmd.output();

      // print success message
      printSuccessMessage();

      // exit successfully
      await emitExitEvent(0);
      Deno.exit(0);
    },
  }),
});

export default upgradeCommand;
