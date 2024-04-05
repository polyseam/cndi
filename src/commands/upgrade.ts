import {
  GHRError,
  GithubReleasesProvider,
  GithubReleasesUpgradeCommand,
} from "src/cliffy-provider-gh-releases/mod.ts";

import { emitExitEvent, getPathToCndiBinary } from "src/utils.ts";
import { ccolors } from "deps";

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
    onComplete: async ({ to, from }, spinner) => {
      const pathToCndiBinary = getPathToCndiBinary();
      const cmd = new Deno.Command(pathToCndiBinary, { args: ["--help"] });
      await cmd.output(); // wait for warm bin before logging success message
      spinner.stop();
      const fromMsg = from ? ` from version ${ccolors.warn(from)}` : "";
      console.log(
        `Successfully upgraded ${
          ccolors.success(
            "cndi",
          )
        }${fromMsg} to version ${ccolors.success(to)}!\n`,
      );
      await emitExitEvent(0);
      Deno.exit(0);
    },
  }),
});

export default upgradeCommand;
