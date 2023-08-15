import {
  ccolors,
  GithubProvider,
  platform,
  SpinnerTypes,
  TerminalSpinner,
  UpgradeCommand,
  UpgradeOptions,
} from "deps";

import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "consts";

import {
  emitExitEvent,
  getCndiInstallPath,
  getFileSuffixForPlatform,
} from "src/utils.ts";

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
      if (response.body && response.status === 200) {
        // write binary to fs then rename, executable can't be overwritten while it's executing
        const cndiFile = await Deno.open(`${destinationPath}-new`, {
          create: true,
          write: true,
          mode: 0o777,
        });
        await response.body.pipeTo(cndiFile.writable, { preventClose: true });
        cndiFile.close();
        const isWindows = platform() === "win32";

        // take existing cndi binary and put it aside
        const oldBinaryDestination = isWindows
          ? destinationPath.replace(".exe", "-old.exe")
          : `${destinationPath}-old`;

        await Deno.rename(destinationPath, oldBinaryDestination);

        // take the freshly downloaded binary, and put it in the right spot
        const newBinaryDestination = isWindows
          ? destinationPath.replace("-new", ".exe")
          : destinationPath;

        await Deno.rename(`${destinationPath}-new`, newBinaryDestination);
      } else {
        spinner.stop();
        console.error(
          upgradeLabel,
          ccolors.error(
            `\nfailed to upgrade ${name} - http response status ${response.status}`,
          ),
        );
        Deno.exit(1100);
      }
      spinner.stop();
      const fromMsg = from ? ` from ${ccolors.warn(from)}` : "";
      console.log(
        `Successfully upgraded ${
          ccolors.prompt(
            name,
          )
        }${fromMsg} to version ${ccolors.success(to)}!\n\n${
          ccolors.prompt(
            `https://github.com/polyseam/cndi/releases/${to}`,
          )
        }`,
      );
      await installDependenciesIfRequired(
        {
          CNDI_HOME,
          KUBESEAL_VERSION,
          TERRAFORM_VERSION,
        },
        true,
      );
    } catch (upgradeError) {
      spinner.stop();
      console.error(
        upgradeLabel,
        ccolors.error(`\nfailed to upgrade ${name}, please try again`),
      );
      console.log(ccolors.caught(upgradeError));
      console.log(
        upgradeLabel,
        ccolors.warn("Please make sure"),
        ccolors.key_name("CNDI_HOME"),
        ccolors.warn("points to the folder containing your cndi binary"),
      );
      await emitExitEvent(1101);
      Deno.exit(1101);
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
