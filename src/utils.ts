import { ccolors, deepMerge, homedir, JSONC, path, platform, walk } from "deps";

import {
  BaseNodeItemSpec,
  CNDIConfig,
  DeploymentTarget,
  TFBlocks,
} from "src/types.ts";

import emitTelemetryEvent from "src/telemetry/telemetry.ts";

const utilsLabel = ccolors.faded("src/utils.ts:");

async function sha256Digest(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

const loadRemoteJSONC = async (url: URL) => {
  const response = await fetch(url);
  const text = await response.text();
  return JSONC.parse(text);
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
}

async function getLeaderNodeNameFromConfig(
  config: CNDIConfig,
): Promise<string> {
  const nodesWithRoleLeader = config.infrastructure.cndi.nodes.filter(
    (node: BaseNodeItemSpec) => node.role === "leader",
  );
  if (nodesWithRoleLeader.length !== 1) {
    console.error(
      utilsLabel,
      ccolors.error("cndi-config exists"),
      ccolors.error("but it does not have exactly 1"),
      ccolors.key_name('"infrastructure.cndi.nodes"'),
      ccolors.error("entry where"),
      ccolors.key_name('"role"'),
      ccolors.error("is"),
      ccolors.key_name('"leader".'),
      ccolors.error("There must be exactly one leader node."),
    );
    await emitExitEvent(200);
    Deno.exit(200);
  }
  return nodesWithRoleLeader[0].name;
}

function getDeploymentTargetFromConfig(config: CNDIConfig): DeploymentTarget {
  return config.infrastructure.cndi.nodes[0].kind;
}

function getTFResource(
  resource_type: string,
  content: Record<never, never>,
  resourceName?: string,
) {
  const name = resourceName ? resourceName : `cndi_${resource_type}`;
  return {
    resource: {
      [resource_type]: {
        [name]: {
          ...content,
        },
      },
    },
  };
}
function getTFData(
  data_type: string,
  content: Record<never, never>,
  resourceName?: string,
) {
  const name = resourceName ? resourceName : `cndi_data_${data_type}`;
  return {
    data: {
      [data_type]: {
        [name]: {
          ...content,
        },
      },
    },
  };
}
interface TFResourceFileObject {
  resource: {
    [key: string]: Record<string, unknown>;
  };
}

async function patchAndStageTerraformResources(
  resourceObj: Record<string, unknown>,
) {
  const suffix = `.tf.json`;
  // resourceObj: { aws_s3_bucket: { cndi_aws_s3_bucket: { ... } } }
  for (const tfResourceType in resourceObj) { // aws_s3_bucket
    const resourceTypeBlock = resourceObj[tfResourceType] as Record<
      string,
      never
    >;

    for (const resourceName in resourceTypeBlock) { // cndi_aws_s3_bucket
      const filename = `${resourceName}${suffix}`;

      let originalContent: TFResourceFileObject = {
        resource: {},
      };

      try {
        originalContent = await loadJSONC(
          path.join(await getStagingDir(), "cndi", "terraform", filename),
        ) as unknown as TFResourceFileObject;
      } catch {
        // there was no pre-existing resource with this name
      }

      // deno-lint-ignore no-explicit-any
      const attrs = resourceTypeBlock[resourceName] as any;
      const originalAttrs =
        originalContent?.resource?.[tfResourceType]?.[resourceName] || {};

      const newContent = {
        ...originalContent,
        resource: {
          ...originalContent.resource,
          [tfResourceType]: {
            [resourceName]: {
              ...deepMerge(originalAttrs, attrs),
            },
          },
        },
      };

      const newContentStr = getPrettyJSONString(newContent);

      await stageFile(
        path.join("cndi", "terraform", filename),
        newContentStr,
      );
    }
  }
}

const terraformBlockTypeNames = [
  "terraform",
  "provider",
  "variable",
  "output",
  "locals",
  "resource",
  "data",
  "module",
];

async function mergeAndStageTerraformObj(
  terraformBlockName: string,
  blockContentsPatch: Record<string, unknown>,
) {
  if (!terraformBlockTypeNames.includes(terraformBlockName)) {
    console.error(
      utilsLabel,
      ccolors.error("there is no terraform block type named"),
      ccolors.user_input(`"${terraformBlockName}"`),
    );
    await emitExitEvent(203);
    Deno.exit(203);
  }

  const pathToTFBlock = path.join(
    "cndi",
    "terraform",
    `${terraformBlockName}.tf.json`,
  );

  let newBlock = {};
  try {
    const originalBlock = await loadJSONC(
      path.join(await getStagingDir(), pathToTFBlock),
    ) as Record<
      string,
      unknown
    >;
    const originalBlockContents = originalBlock?.[terraformBlockName];
    newBlock = deepMerge(
      originalBlockContents || {},
      blockContentsPatch,
    );
  } catch {
    // there was no pre-existing block with this name
    newBlock = blockContentsPatch;
  }

  await stageFile(
    pathToTFBlock,
    getPrettyJSONString({ [terraformBlockName]: newBlock }),
  );
}

// MUST be called after all other terraform files have been staged
async function patchAndStageTerraformFilesWithConfig(config: CNDIConfig) {
  if (!config?.infrastructure?.terraform) return;
  const terraformBlocks = config.infrastructure.terraform as TFBlocks;
  const workload: Array<Promise<void>> = [];

  for (const tftype in terraformBlocks) { // terraform[key]: resource, data, provider, etc.\
    if (tftype === "resource") {
      const resources = config.infrastructure?.terraform?.resource;

      const blockContainsResources = resources &&
        Object.keys(resources).length &&
        typeof resources === "object";

      if (
        blockContainsResources
      ) {
        workload.push(
          patchAndStageTerraformResources(
            resources,
          ),
        );
      }
    } else {
      const t = tftype as keyof TFBlocks;
      const contentObj = config.infrastructure?.terraform?.[t];

      const blockContainsEntries = contentObj &&
        Object.keys(contentObj).length &&
        typeof contentObj === "object";

      if (
        blockContainsEntries
      ) {
        workload.push(mergeAndStageTerraformObj(tftype, contentObj));
      }
    }
  }
  try {
    await Promise.all(workload);
  } catch (error) {
    console.error(
      utilsLabel,
      ccolors.error("error patching terraform files with config"),
    );
    console.log(ccolors.caught(error));
  }
}

function getPathToTerraformBinary() {
  const fileSuffixForPlatform = getFileSuffixForPlatform();
  const CNDI_HOME = path.join(homedir() || "~", ".cndi");
  const pathToTerraformBinary = path.join(
    CNDI_HOME,
    `terraform-${fileSuffixForPlatform}`,
  );
  return pathToTerraformBinary;
}

function getPathToKubesealBinary() {
  const fileSuffixForPlatform = getFileSuffixForPlatform();
  const CNDI_HOME = path.join(homedir() || "~", ".cndi");
  const pathToKubesealBinary = path.join(
    CNDI_HOME,
    `kubeseal-${fileSuffixForPlatform}`,
  );
  return pathToKubesealBinary;
}

async function stageFile(relativePath: string, fileContents: string) {
  const stagingPath = path.join(await getStagingDir(), relativePath);
  await Deno.mkdir(path.dirname(stagingPath), { recursive: true });
  await Deno.writeTextFile(stagingPath, fileContents);
}

async function getStagingDir(): Promise<string> {
  const stagingDirectory = Deno.env.get("CNDI_STAGING_DIRECTORY");
  if (!stagingDirectory) {
    console.error(
      utilsLabel,
      `${ccolors.key_name(`"CNDI_STAGING_DIRECTORY"`)}`,
      ccolors.error(`is not set!`),
    );
    await emitExitEvent(202);
    Deno.exit(202);
  }
  return stagingDirectory;
}

async function persistStagedFiles(targetDirectory: string) {
  const stagingDirectory = await getStagingDir();
  for await (const entry of walk(stagingDirectory)) {
    if (entry.isFile) {
      const fileContents = await Deno.readTextFile(entry.path);
      const destinationAbsPath = entry.path.replace(
        stagingDirectory,
        targetDirectory,
      );

      await Deno.mkdir(path.dirname(destinationAbsPath), { recursive: true });
      await Deno.writeTextFile(destinationAbsPath, fileContents, {
        create: true,
      });
    }
  }
  await Deno.remove(stagingDirectory, { recursive: true });
}

async function checkInstalled(
  CNDI_HOME: string = path.join(homedir() || "~", ".cndi"),
) {
  try {
    // if any of these files/folders don't exist, return false
    await Promise.all([
      Deno.stat(CNDI_HOME),
      Deno.stat(getPathToTerraformBinary()),
      Deno.stat(getPathToKubesealBinary()),
    ]);

    return true;
  } catch {
    return false;
  }
}

async function checkInitialized(output: string) {
  // if any of these files/folders don't exist, return false
  try {
    await Promise.all([
      Deno.stat(path.join(output, "cndi")),
      Deno.stat(path.join(output, ".gitignore")),
      Deno.stat(path.join(output, ".env")),
    ]);
    return true;
  } catch {
    return false;
  }
}

const getFileSuffixForPlatform = () => {
  const fileSuffixForPlatform = {
    linux: "linux",
    darwin: "mac",
    win32: "win.exe",
  };
  const currentPlatform = platform() as "linux" | "darwin" | "win32";
  return fileSuffixForPlatform[currentPlatform];
};

const getCndiInstallPath = async (): Promise<string> => {
  if (!homedir()) {
    console.error(
      utilsLabel,
      ccolors.error("cndi could not find your home directory!"),
    );
    console.log(
      'try setting the "HOME" environment variable on your system.',
    );
    await emitExitEvent(204);
    Deno.exit(204);
  }
  let suffix = "";
  if (platform() === "win32") {
    suffix = ".exe";
  }
  return path.join(homedir()!, "bin", `cndi${suffix}`);
};

const getPathToOpenSSLForPlatform = () => {
  const currentPlatform = platform() as "linux" | "darwin" | "win32";

  if (currentPlatform === "win32") {
    return path.join("/", "Program Files", "Git", "usr", "bin", "openssl.exe");
  }

  return path.join("/", "usr", "bin", "openssl");
};

function base10intToHex(decimal: number): string {
  // if the int8 in hex is less than 2 characters, prepend 0
  const hex = decimal.toString(16).padStart(2, "0");
  return hex;
}

function getSecretOfLength(len = 32): string {
  if (len % 2) {
    throw new Error("password length must be even");
  }

  const values = new Uint8Array(len / 2);
  crypto.getRandomValues(values);
  return Array.from(values, base10intToHex).join("");
}

async function emitExitEvent(exit_code: number) {
  const event_uuid = await emitTelemetryEvent("command_exit", { exit_code });
  const isDebug = Deno.env.get("CNDI_TELEMETRY") === "debug";
  if (isDebug) console.log("\nevent_uuid", event_uuid);
  console.log();
}

export {
  checkInitialized,
  checkInstalled,
  emitExitEvent,
  getCndiInstallPath,
  getDeploymentTargetFromConfig,
  getFileSuffixForPlatform,
  getLeaderNodeNameFromConfig,
  getPathToKubesealBinary,
  getPathToOpenSSLForPlatform,
  getPathToTerraformBinary,
  getPrettyJSONString,
  getSecretOfLength,
  getStagingDir,
  getTFData,
  getTFResource,
  loadJSONC,
  loadRemoteJSONC,
  patchAndStageTerraformFilesWithConfig,
  persistStagedFiles,
  sha256Digest,
  stageFile,
};
