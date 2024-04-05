import {
  colors,
  ensureDirSync,
  homedir,
  inflateResponse,
  Octokit,
  Provider,
  semver,
  Spinner,
  UpgradeCommand,
  walkSync,
} from "./deps.ts";

import type { GithubProviderOptions, UpgradeOptions } from "./deps.ts";

const OLD_VERSION_TAG = ".GHR_OLD.";

type AvailableOS = typeof Deno.build.os;

type OSAssetMap = {
  [K in AvailableOS]?: string;
};

const _ERROR_CODE_MAP = {
  1: "repository must be in the format 'owner/repo'",
  2: "Found old version but failed to delete",
  3: "No asset found for the current OS",
  4: "Network Error: Failed to fetch GitHub Release Asset",
  5: "Network Error: Failed to fetch GitHub Release List",
  6: "Failed to inflate response",
  7: "Failed to stash old version",
  8: "Failed to install new version",
  1404: "GitHub Release Asset Not Found",
  1403: "GitHub Release Asset Request Forbidden",
  2404: "GitHub Release List Not Found",
  2403: "GitHub Release List Request Forbidden",
};

export class GHRError extends Error {
  code: number;
  metadata: Record<string, unknown>;
  constructor(message: string, code: number, metadata = {}) {
    super(message);
    this.code = code;
    this.metadata = metadata;
  }
}

type OnCompleteMetadata = {
  to: string;
  from?: string;
};

type OnCompleteFinalCallback = () => void;

interface GithubReleasesProviderOptions extends GithubProviderOptions {
  destinationDir: string;
  displaySpinner?: boolean;
  prerelease?: boolean;
  untar?: boolean;
  cleanupOld?: boolean;
  osAssetMap: OSAssetMap;
  onComplete?: (
    metadata: OnCompleteMetadata,
    cb: OnCompleteFinalCallback,
  ) => void | never;
  onError?: (error: GHRError) => void | never;
}

type GithubReleaseVersions = {
  versions: string[];
  latest: string;
};

function latestSemVerFirst(a: string, b: string): number {
  const aParsed = semver.tryParse(a);
  const bParsed = semver.tryParse(b);
  if (aParsed && bParsed) {
    // compare a and b in descending order
    return semver.compare(bParsed, aParsed);
  } else {
    return 0; // SemVer parsing failed in atleast one value, preserve order
  }
}

export class GithubReleasesProvider extends Provider {
  name: string = "GithubReleaseProvider";
  displaySpinner: boolean = true;
  prerelease: boolean = false;
  destinationDir: string;
  octokit: Octokit;
  owner: string;
  repo: string;
  osAssetMap: OSAssetMap;
  cleanupOld: boolean = true;
  onComplete?: (
    metadata: OnCompleteMetadata,
    cb: OnCompleteFinalCallback,
  ) => void | never;
  onError?: (error: GHRError) => void | never;

  constructor(options: GithubReleasesProviderOptions) {
    super();

    const [owner, repo] = options.repository.split("/");

    if (!owner || !repo) {
      const error = new GHRError(
        "repository must be in the format 'owner/repo'",
        1,
        {
          repository: options.repository,
        },
      );
      this.onError?.(error);
      throw error;
    }

    this.owner = owner;
    this.repo = repo;
    this.destinationDir = options.destinationDir.replace("~", homedir());

    ensureDirSync(this.destinationDir);
    this.osAssetMap = options.osAssetMap;

    if (options.displaySpinner === false) {
      this.displaySpinner = false;
    }

    if (options.prerelease === true) {
      this.prerelease = true;
    }

    this.octokit = new Octokit({});

    if (options.cleanupOld === false) {
      this.cleanupOld = false;
    }

    if (this.cleanupOld) {
      // triggering this in the provider constructor is somewhat gross
      // however it's the only way to ensure that the cleanup happens
      this.cleanOldVersions();
    }
    this.onComplete = options?.onComplete ||
      ((_meta: OnCompleteMetadata, _cb: OnCompleteFinalCallback) => {});
    this.onError = options?.onError || ((_error: Error) => {});
  }

  cleanOldVersions() {
    for (const entry of walkSync(this.destinationDir)) {
      if (entry.path.includes(OLD_VERSION_TAG)) {
        try {
          Deno.removeSync(entry.path);
        } catch (caught) {
          if (!(caught instanceof Deno.errors.NotFound)) {
            const foundButFailedToDelete = new GHRError(
              "Found old version but failed to delete",
              2,
              {
                oldfile: entry.path,
                caught,
              },
            );
            this.onError?.(foundButFailedToDelete);
            throw foundButFailedToDelete;
          }
        }
      }
    }
  }

  getRepositoryUrl(_name: string): string {
    return `https://github.com/${this.owner}/${this.repo}/releases`;
  }

  getRegistryUrl(_name: string, version: string): string {
    return `https://github.com/${this.owner}/${this.repo}/releases/tag/${version}`;
  }

  getDownloadUrl(version: string, os: AvailableOS): URL {
    if (!this.osAssetMap[os]) {
      const error = new GHRError("No asset found for the current OS", 3, {
        os,
        osAssetMap: JSON.stringify(this.osAssetMap, null, 2),
      });
      this.onError?.(error);
      throw error;
    }
    const assetName = this.osAssetMap[os];
    return new URL(
      `https://github.com/${this.owner}/${this.repo}/releases/download/${version}/${assetName}`,
    );
  }

  // CNDI Specific
  echoUpgrade(options: UpgradeOptions): void {
    const { to } = options;
    const prereleaseFlag = this.prerelease ? " --prerelease" : "";
    const versionFlag = to !== "latest" ? ` --version ${to}` : "";
    console.log(`cndi upgrade${prereleaseFlag}${versionFlag}\n`);
  }

  // Add your custom code here
  async upgrade(options: UpgradeOptions): Promise<void> {
    let { name, from, to } = options;
    this.echoUpgrade(options);

    const spinner = new Spinner({
      message: `Upgrading ${colors.cyan(name)} from ${
        colors.yellow(
          from || "?",
        )
      } to version ${colors.cyan(to)}...`,
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

    if (this.displaySpinner) {
      spinner.start();
    }

    const versions = await this.getVersions(name);

    if (to === "latest") {
      to = versions.latest;
    }

    const os = Deno.build.os;

    const downloadUrl = this.getDownloadUrl(to, os);
    const stagingDir = Deno.makeTempDirSync();
    let response: Response;

    try {
      response = await fetch(downloadUrl);
    } catch (errorFetching) {
      const error = new GHRError(
        "Network Error: Failed to fetch GitHub Release Asset",
        4,
        {
          caught: errorFetching,
          url: downloadUrl,
        },
      );
      this.onError?.(error);
      throw error;
    }

    if (response.body && response.status === 200) {
      try {
        await inflateResponse(response, stagingDir, {
          compressionFormat: "gzip",
          doUntar: true,
        });
      } catch (caught) {
        const error = new GHRError("Failed to inflate response", 6, {
          caught,
        });
        this.onError?.(error);
        throw error;
      }

      for (const entry of walkSync(stagingDir)) {
        if (entry.isFile) {
          const finalPath = entry.path.replace(stagingDir, this.destinationDir);

          try {
            // stash the old version
            Deno.renameSync(finalPath, `${finalPath}${OLD_VERSION_TAG}`);
          } catch (caught) {
            if (!(caught instanceof Deno.errors.NotFound)) {
              const error = new GHRError("Failed to stash old version", 7, {
                caught,
                oldfile: finalPath,
              });
              this.onError?.(error);
              throw error;
            }
          }

          // install the new version
          try {
            Deno.renameSync(entry.path, finalPath);
          } catch (caught) {
            const error = new GHRError("Failed to install new version", 8, {
              caught,
              newfile: entry.path,
            });
            this.onError?.(error);
            throw error;
          }
          if (os !== "windows") {
            Deno.chmodSync(finalPath, 0o755);
          }
        }
      }

      this?.onComplete?.({ to, from }, function printSuccessMessage() {
        spinner.stop();
        const fromMsg = from ? ` from version ${colors.yellow(from)}` : "";
        console.log(
          `Successfully upgraded ${
            colors.green(
              name,
            )
          }${fromMsg} to version ${colors.green(to)}!\n`,
        );
      });
    } else {
      if (response.status === 404) {
        const error = new GHRError("GitHub Release Asset Not Found", 1404, {
          url: downloadUrl,
          status: response.status,
        });
        this.onError?.(error);
        throw error;
      }

      if (response.status === 403) {
        const error = new GHRError(
          "GitHub Release Asset Request Forbidden",
          1403,
          {
            url: downloadUrl,
            status: response.status,
          },
        );
        this.onError?.(error);
        throw error;
      }

      const error = new GHRError(
        "GitHub Release Asset Request Failed",
        parseInt(`1${response.status}`),
        {
          url: downloadUrl,
          status: response.status,
        },
      );

      this.onError?.(error);
      throw error;
    }
  }

  async getVersions(_name: string): Promise<GithubReleaseVersions> {
    const url =
      `https://api.github.com/repos/${this.owner}/${this.repo}/releases`;
    try {
      const listReleasesResponse = await this.octokit.request(
        "GET /repos/{owner}/{repo}/releases",
        {
          owner: this.owner,
          repo: this.repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (listReleasesResponse.status === 200) {
        const versions = listReleasesResponse.data
          .filter((release) => {
            // never include draft releases
            if (release.draft) return false;
            // only include prereleases if the prerelease option is set to true
            if (release.prerelease) {
              if (this.prerelease) return true;
              // otherwise include all non-prerelease releases
              return false;
            }
            return true;
          })
          .map(({ tag_name }) => tag_name)
          .sort(latestSemVerFirst);

        const latest = versions[0];

        return {
          versions, // branches and tags
          latest,
        };
      } else {
        if (listReleasesResponse.status === 404) {
          const error = new GHRError("GitHub Release List Not Found", 2404, {
            url,
            status: listReleasesResponse.status,
          });
          this.onError?.(error);
          throw error;
        }

        if (listReleasesResponse.status === 403) {
          const error = new GHRError(
            "GitHub Release List Request Forbidden",
            2403,
            {
              url,
              status: listReleasesResponse.status,
            },
          );
          this.onError?.(error);
          throw error;
        }

        const error = new GHRError(
          "GitHub Release List Request Failed",
          parseInt(`2${listReleasesResponse.status}`),
          {
            status: listReleasesResponse.status,
            url,
          },
        );
        this.onError?.(error);
        throw error;
      }
    } catch (error) {
      const getVersionsNetworkError = new GHRError(
        "Network Error: Failed to fetch Release List from GitHub.",
        5,
        {
          caught: error,
          url,
        },
      );
      this.onError?.(getVersionsNetworkError);
      throw getVersionsNetworkError;
    }
  }

  async listVersions(
    name: string,
    currentVersion?: string | undefined,
  ): Promise<void> {
    const { versions } = await this.getVersions(name);
    super.printVersions(versions, currentVersion, { indent: 0 });
  }
}

interface GithubReleasesUpgradeOptions {
  provider: GithubReleasesProvider;
}

export class GithubReleasesUpgradeCommand extends UpgradeCommand {
  constructor(options: GithubReleasesUpgradeOptions) {
    super(options);

    this.option(
      "--pre-release, --prerelease",
      "Include GitHub Releases marked pre-release",
      () => {
        // this is strange, but seems to work
        options.provider.prerelease = true;
      },
    );
  }
}
