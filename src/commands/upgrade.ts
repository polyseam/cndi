import { writableStreamFromWriter } from "https://deno.land/std@0.177.0/streams/writable_stream_from_writer.ts";
import {
  GithubProvider,
  UpgradeOptions,
} from "https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { getCndiInstallPath, getFileSuffixForPlatform } from "../utils.ts";
import {
  SpinnerTypes,
  TerminalSpinner,
} from "https://deno.land/x/spinners@v1.1.2/mod.ts";
import { UpgradeCommand } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

const upgradeLabel = colors.white("\nupgrade:");
class GitHubBinaryUpgradeProvider extends GithubProvider {
  async upgrade({ name, from, to }: UpgradeOptions): Promise<void> {
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
    try {
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
      const fromMsg = from ? ` from ${colors.yellow(from)}` : "";
      console.info(
        `Successfully upgraded ${colors.cyan(name)}${fromMsg} to version ${
          colors.green(to)
        }!\n\n${
          colors.cyan(`https://github.com/polyseam/cndi/releases/${to}`)
        }`,
      );
    } catch (upgradeError) {
      console.log(
        upgradeLabel,
        colors.brightRed(`\nfailed to upgrade ${name}, please try again`),
      );
      console.log(upgradeError);
    }
  }
}

const upgradeCommand = new UpgradeCommand({
  provider: new GitHubBinaryUpgradeProvider({
    repository: "polyseam/cndi",
    branches: false,
  }),
});

export default upgradeCommand;
