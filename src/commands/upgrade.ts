import {
  ccolors,
  GithubProvider,
  KUBESEAL_VERSION,
  SpinnerTypes,
  TerminalSpinner,
  TERRAFORM_VERSION,
  UpgradeCommand,
  UpgradeOptions,
  writableStreamFromWriter,
} from "deps";

import { getCndiInstallPath, getFileSuffixForPlatform } from "src/utils.ts";

import installDependenciesIfRequired from "src/install.ts";

const upgradeLabel = ccolors.faded("\nsrc/commands/upgrade.ts:");
class GitHubBinaryUpgradeProvider extends GithubProvider {
  async upgrade({ name, from, to }: UpgradeOptions): Promise<void> {
    const CNDI_HOME = Deno.env.get("CNDI_HOME")!;
    const spinner = new TerminalSpinner({
      text: `Upgrading ${name} from ${from} to version ${to}...`,
      color: "cyan",
      indent: 2,
      spinner: SpinnerTypes.windows,
      writer: Deno.stdout,
    });

    const destinationPath = await getCndiInstallPath();

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
      const fromMsg = from ? ` from ${ccolors.warn(from)}` : "";
      console.log(
        `Successfully upgraded ${ccolors.prompt(name)}${fromMsg} to version ${
          ccolors.success(to)
        }!\n\n${
          ccolors.prompt(`https://github.com/polyseam/cndi/releases/${to}`)
        }`,
      );
      await installDependenciesIfRequired({
        CNDI_HOME,
        KUBESEAL_VERSION,
        TERRAFORM_VERSION,
      }, true);
    } catch (upgradeError) {
      console.error(
        upgradeLabel,
        ccolors.error(`\nfailed to upgrade ${name}, please try again`),
      );
      console.log(
        "if you are still having issues, you can update the cndi binary manually here:",
      );
      console.log(
        ccolors.key_name("https://github.com/polyseam/cndi#installation-"),
      );
      console.log(ccolors.caught(upgradeError));
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
