import {
  ccolors,
  GithubProvider,
  path,
  platform,
  Spinners,
  TerminalSpinner,
  UpgradeCommand,
  UpgradeOptions,
} from "deps";

import { KUBESEAL_VERSION, TERRAFORM_VERSION } from "consts";

import { emitExitEvent, getCndiInstallPath } from "src/utils.ts";

import installDependenciesIfRequired from "src/install.ts";

const upgradeLabel = ccolors.faded("\nsrc/commands/upgrade.ts:");

const MACOSX_TRASH_DIR = "__MACOSX";

const getReleaseSuffixForPlatform = () => {
  const fileSuffixForPlatform = {
    linux: "linux",
    darwin: "mac",
    win32: "win",
  };
  const currentPlatform = platform() as "linux" | "darwin" | "win32";
  return fileSuffixForPlatform[currentPlatform];
};

class GitHubBinaryUpgradeProvider extends GithubProvider {
  async upgrade({ name, from, to }: UpgradeOptions): Promise<void> {
    const CNDI_HOME = Deno.env.get("CNDI_HOME")!;
    const spinner = new TerminalSpinner({
      text: `Upgrading ${name} from ${from} to version ${to}...`,
      color: "cyan",
      indent: 2,
      spinner: Spinners.windows,
      writer: Deno.stdout,
    });

    const destinationPath = await getCndiInstallPath();

    if (to === "latest") {
      const { latest } = await this.getVersions(name);
      to = latest;
    }

    spinner.start();

    const binaryUrl = new URL(
      `https://github.com/polyseam/cndi/releases/download/${to}/cndi-${getReleaseSuffixForPlatform()}.zip`,
    );
    try {
      const response = await fetch(binaryUrl);
      if (response.body && response.status === 200) {
        // write binary to fs then rename, executable can't be overwritten while it's executing

        const zipPath = `${destinationPath}.zip`;

        const cndiFile = await Deno.open(zipPath, {
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

        try {
          await Deno.rename(destinationPath, oldBinaryDestination);
        } catch (_err) {
          // the old binary doesn't exist
          // user is likely a dev executing cndi-next upgrade
        }

        const unzipCommand = new Deno.Command("unzip", {
          args: [
            "-o",
            zipPath,
            "-d",
            path.dirname(destinationPath),
          ],
          stdout: "piped",
          stderr: "piped",
        });

        const unzipCommandOutput = await unzipCommand.output();

        if (unzipCommandOutput.code !== 0) {
          Deno.stdout.write(unzipCommandOutput.stderr);
          Deno.exit(232323); // arbitrary exit code
        }

        try {
          await Deno.remove(zipPath);
          await Deno.remove(
            path.join(path.dirname(destinationPath), MACOSX_TRASH_DIR),
            {
              recursive: true,
            },
          );
        } catch (_cleanupError) {
          // removing extra files if possible
        }
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
        ccolors.error(`\nfailed to upgrade ${name}`),
      );
      console.log(ccolors.caught(upgradeError));
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
