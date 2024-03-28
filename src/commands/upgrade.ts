import {
  GHRError,
  GithubReleaseProvider,
} from "src/cliffy-provider-gh-releases/mod.ts";
import { UpgradeCommand } from "deps";
import { emitExitEvent } from "src/utils.ts";

const upgradeCommand = new UpgradeCommand({
  provider: new GithubReleaseProvider({
    repository: "polyseam/cndi",
    destinationDir: "~/.cndi/bin",
    osAssetMap: {
      windows: "cndi-win.tar.gz",
      linux: "cndi-linux.tar.gz",
      darwin: "cndi-mac.tar.gz",
    },
    onError: async (error: GHRError) => {
      const exit_code = parseInt(`8${error.code}`);
      await emitExitEvent(exit_code);
      Deno.exit(exit_code);
    },
    onComplete: async (_version) => {
      await emitExitEvent(0);
      Deno.exit(0);
    },
  }),
});

export default upgradeCommand;
