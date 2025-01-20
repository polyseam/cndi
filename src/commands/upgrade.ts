import {
  GHRError,
  GithubReleasesProvider,
  GithubReleasesUpgradeCommand,
} from "deps";

import { emitExitEvent, getPathToCndiBinary } from "src/utils.ts";

const destinationDir = "~/.cndi/bin";

const upgradeCommand = new GithubReleasesUpgradeCommand({
  // @ts-ignore - hotfix!
  spinner: false,
  provider: new GithubReleasesProvider({
    repository: "polyseam/cndi",
    destinationDir,
    targetAssetMap: {
      "windows-x86_64": "cndi-win-amd64.tar.gz",
      "linux-x86_64": "cndi-linux-amd64.tar.gz",
      "linux-aarch64": "cndi-linux-arm64.tar.gz",
      "darwin-x86_64": "cndi-mac-amd64.tar.gz",
      "darwin-aarch64": "cndi-mac-arm64.tar.gz",
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
