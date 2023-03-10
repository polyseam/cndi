import * as JSONC from "https://deno.land/std@0.173.0/encoding/jsonc.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { deepMerge } from "https://deno.land/std@0.179.0/collections/deep_merge.ts";
import { platform } from "https://deno.land/std@0.173.0/node/os.ts";
import { walk } from "https://deno.land/std@0.173.0/fs/mod.ts";
import {
  BaseNodeItemSpec,
  CNDIConfig,
  NODE_KIND,
  NodeKind,
  TFBlocks,
} from "./types.ts";
import { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
}

function getLeaderNodeNameFromConfig(config: CNDIConfig) {
  const leaderNode = config.infrastructure.cndi.nodes.find(
    (node: BaseNodeItemSpec) => node.role === "leader",
  );
  if (!leaderNode) {
    console.log('no node with role "leader" node found in config!');
    Deno.exit(1);
  }
  if (!leaderNode.name) {
    console.log(
      'no name found for node with role "leader" node found in config!',
    );
    Deno.exit(1);
  }
  return leaderNode.name;
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
          path.join(getStagingDir(), "cndi", "terraform", filename),
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
    console.log("there is no terraform block type named", terraformBlockName);
    Deno.exit(1);
  }

  const pathToTFBlock = path.join(
    "cndi",
    "terraform",
    `${terraformBlockName}.tf.json`,
  );
  let newBlock = {};
  try {
    const originalBlock = await loadJSONC(
      path.join(getStagingDir(), pathToTFBlock),
    ) as Record<
      string,
      unknown
    >;
    newBlock = deepMerge(originalBlock, blockContentsPatch);
  } catch {
    // there was no pre-existing block with this name
    newBlock = blockContentsPatch;
  }

  await stageFile(pathToTFBlock, getPrettyJSONString(newBlock));
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
    console.log("error patching terraform files with config");
    console.log(error);
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
  const stagingPath = path.join(getStagingDir(), relativePath);
  await Deno.mkdir(path.dirname(stagingPath), { recursive: true });
  await Deno.writeTextFile(stagingPath, fileContents);
}

function getStagingDir() {
  const stagingDirectory = Deno.env.get("CNDI_STAGING_DIRECTORY");
  if (!stagingDirectory) {
    console.error(`${colors.yellow("CNDI_STAGING_DIRECTORY")} is not set!\n`);
    Deno.exit(1);
  }
  return stagingDirectory;
}

function stageFileSync(relativePath: string, fileContents: string) {
  const stagingDirectory = getStagingDir();
  const stagingPath = path.join(stagingDirectory, relativePath);
  Deno.mkdirSync(path.dirname(stagingPath), { recursive: true });
  Deno.writeTextFileSync(stagingPath, fileContents);
}

async function persistStagedFiles(targetDirectory: string) {
  const stagingDirectory = getStagingDir();
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

const getCndiInstallPath = (): string => {
  if (!homedir()) {
    console.error(colors.red("cndi could not find your home directory!"));
    console.log('try setting the "HOME" environment variable on your system.');
    Deno.exit(1);
  }
  return path.join(homedir()!, "bin", `cndi-${getFileSuffixForPlatform()}`);
};

const getPathToOpenSSLForPlatform = () => {
  const currentPlatform = platform() as "linux" | "darwin" | "win32";

  if (currentPlatform === "win32") {
    return path.join("/", "Program Files", "Git", "usr", "bin", "openssl.exe");
  }

  return path.join("/", "usr", "bin", "openssl");
};

function getDefaultVmTypeForKind(kind: NodeKind): [string, string] {
  switch (kind) {
    // most recent 4vCPU/16GiB Ram VMs
    case NODE_KIND.aws:
      return ["instance_type", "m5a.large"];
    case NODE_KIND.gcp:
      return ["machine_type", "n2-standard-2"];
    case NODE_KIND.azure:
      return ["machine_type", "Standard_D4s_v3"];
    default:
      console.log("Unknown kind: " + kind);
      Deno.exit(1);
  }
}

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

export {
  checkInitialized,
  checkInstalled,
  getCndiInstallPath,
  getDefaultVmTypeForKind,
  getFileSuffixForPlatform,
  getLeaderNodeNameFromConfig,
  getPathToKubesealBinary,
  getPathToOpenSSLForPlatform,
  getPathToTerraformBinary,
  getPrettyJSONString,
  getSecretOfLength,
  getStagingDir,
  getTFResource,
  loadJSONC,
  patchAndStageTerraformFilesWithConfig,
  persistStagedFiles,
  stageFile,
  stageFileSync,
};
