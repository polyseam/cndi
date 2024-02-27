import {
  ccolors,
  GithubProvider,
  inflateResponse,
  path,
  platform,
  Spinner,
  UpgradeCommand,
  UpgradeOptions,
} from "deps";

import { emitExitEvent, getCndiInstallPath } from "src/utils.ts";

const upgradeLabel = ccolors.faded("\nsrc/commands/upgrade.ts:");

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
    const spinner = new Spinner({
      message: `Upgrading ${name} from ${from} to version ${to}...`,
      color: "cyan",
      spinner: [
        "▰▱▱▱▱▱▱",
        "▰▰▱▱▱▱▱",
        "▰▰▰▱▱▱▱",
        "▰▰▰▰▱▱▱",
        "▰▰▰▰▰▱▱",
        "▰▰▰▰▰▰▱",
        "▰▰▰▰▰▰▰",
        "▰▱▱▱▱▱▱",
      ],
      interval: 80,
    });

    const destinationPath = await getCndiInstallPath();

    if (to === "latest") {
      const { latest } = await this.getVersions(name);
      to = latest;
    }

    spinner.start();

    const binaryUrl = new URL(
      `https://github.com/polyseam/cndi/releases/download/${to}/cndi-${getReleaseSuffixForPlatform()}.tar.gz`,
    );
    try {
      const response = await fetch(binaryUrl);
      if (response.body && response.status === 200) {
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

        // write binary to fs then rename, executable can't be overwritten while it's executing

        const folderName =
          `${destinationPath}-${getReleaseSuffixForPlatform()}`;

        await inflateResponse(response, folderName, {
          compressionFormat: "gzip",
          doUntar: true,
        });

        for await (const entry of Deno.readDirSync(folderName)) {
          if (entry.isFile) {
            const finalDest = path.join(
              path.dirname(destinationPath),
              entry.name,
            );
            await Deno.rename(
              path.join(folderName, entry.name),
              path.join(finalDest),
            );
            if (!isWindows) {
              await Deno.chmod(finalDest, 0o755);
            }
          }
        }

        await Deno.remove(folderName, { recursive: true });
        await Deno.remove(`${folderName}.tar`);
      } else {
        spinner.stop();
        console.error(
          upgradeLabel,
          ccolors.error(
            `\nfailed to upgrade ${name} - http response status ${response.status}`,
          ),
        );
        await emitExitEvent(1100);
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
    await emitExitEvent(0);
  }
}

const upgradeCommand = new UpgradeCommand({
  provider: new GitHubBinaryUpgradeProvider({
    repository: "polyseam/cndi",
    branches: false,
  }),
});

export default upgradeCommand;
