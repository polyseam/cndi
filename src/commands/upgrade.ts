import { writableStreamFromWriter } from "https://deno.land/std@0.177.0/streams/writable_stream_from_writer.ts";
import {
  GithubProvider,
  UpgradeOptions,
} from "https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts";
import { getCndiInstallPath, getFileSuffixForPlatform } from "../utils.ts";
import {
  SpinnerTypes,
  TerminalSpinner,
} from "https://deno.land/x/spinners@v1.1.2/mod.ts";
import { UpgradeCommand } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

class GitHubBinaryUpgradeProvider extends GithubProvider {
  async upgrade({ name, from, to }: UpgradeOptions): Promise<void> {
    console.log();
    const spinner = new TerminalSpinner({
      text: `Upgrading ${name} from ${from} to version ${to}...`,
      color: "cyan",
      indent: 2,
      spinner: SpinnerTypes.windows,
      writer: Deno.stdout,
    });

    const destinationPath = getCndiInstallPath();

    if (to === "latest") {
      const { latest } = await this.getVersions(name);
      to = latest;
    }

    spinner.start();
    const binaryUrl = new URL(
      `https://github.com/polyseam/cndi/releases/download/${to}/cndi-${getFileSuffixForPlatform()}`,
    );
    const response = await fetch(binaryUrl);
    if (response.body) {
      const cndiFile = await Deno.open(destinationPath, {
        create: true,
        write: true,
        mode: 0o777,
      });
      const cndiWritableStream = writableStreamFromWriter(cndiFile);
      await response.body.pipeTo(cndiWritableStream);
    }
    spinner.stop();
    console.info(
      `Successfully upgraded ${name} from ${from} to version ${to}! \n${
        this.getRegistryUrl(
          name,
          to,
        )
      })`,
    );
  }
}

const upgradeCommand = new UpgradeCommand({
  provider: new GitHubBinaryUpgradeProvider({
    repository: "polyseam/cndi",
    branches: false,
  }),
});

export default upgradeCommand;
