import {
  ccolors,
  copy,
  deepMerge,
  exists,
  homedir,
  JSONC,
  path,
  platform,
  walk,
  YAML,
} from "deps";

import { DEFAULT_OPEN_PORTS, error_code_reference } from "consts";

import {
  CNDIConfig,
  CNDIDistribution,
  CNDIPort,
  CNDITaintEffect,
  NodeRole,
  TFBlocks,
} from "src/types.ts";

import { CNDITemplatePromptResponsePrimitive } from "src/use-template/types.ts";

import { ErrOut } from "errout";

import { emitTelemetryEvent } from "src/telemetry/telemetry.ts";

const label = ccolors.faded("src/utils.ts:");

// YAML.stringify but easier to work with
function getYAMLString(object: unknown, skipInvalid = true): string {
  // if the object contains an undefined, skipInvalid will not write the key
  // skipInvalid: true is most similar to JSON.stringify
  return YAML.stringify(object as Record<string, unknown>, {
    skipInvalid,
  });
}

async function emitExitEvent(exit_code: number) {
  const event_uuid = await emitTelemetryEvent("command_exit", { exit_code });
  const isDebug = Deno.env.get("CNDI_TELEMETRY") === "debug";
  if (exit_code) console.error(getErrorDiscussionLinkMessageForCode(exit_code));
  if (isDebug) console.log("\nevent_uuid", event_uuid);
  console.log();
}

async function sha256Digest(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

const removeOldBinaryIfRequired = async (
  CNDI_HOME: string,
): Promise<boolean> => {
  const isWindows = platform() === "win32";
  const pathToGarbageBinary = isWindows
    ? path.join(CNDI_HOME, "bin", "cndi-old.exe")
    : path.join(CNDI_HOME, "bin", "cndi-old");

  try {
    await Deno.remove(pathToGarbageBinary);
  } catch {
    return false;
  }
  return true;
};

const getTaintEffectForDistribution = (
  effect: CNDITaintEffect,
  distribution: CNDIDistribution,
) => {
  if (distribution === "aks") {
    return effect;
  } else {
    const effectMap = {
      NoSchedule: "NO_SCHEDULE",
      PreferNoSchedule: "PREFER_NO_SCHEDULE",
      NoExecute: "NO_EXECUTE",
    };
    return effectMap[effect];
  }
};

type LoadConfigSuccessResult = {
  config: CNDIConfig;
  pathToConfig: string;
};

export type PxSuccessResult<T> = [undefined, T];
export type PxErrorResult = [ErrOut];
export type PxResult<T> = PxSuccessResult<T> | PxErrorResult;

// attempts to find cndi_config.yaml or cndi_config.jsonc, then returns its value and location
const loadCndiConfig = async (
  projectDirectory: string,
): Promise<PxResult<LoadConfigSuccessResult>> => {
  let pathToConfig = path.join(projectDirectory, "cndi_config.yaml");

  if (!(await exists(pathToConfig))) {
    pathToConfig = path.join(projectDirectory, "cndi_config.yml");
  }

  if (!(await exists(pathToConfig))) {
    return [
      new ErrOut(
        [
          ccolors.error("failed to find a"),
          ccolors.key_name(`cndi_config.yaml`),
          ccolors.error("file at"),
          ccolors.user_input(path.join(projectDirectory, "cndi_config.yaml")),
        ],
        {
          id: "loadCndiConfig/not-found",
          code: 500,
          metadata: {
            pathToConfig,
          },
          label,
        },
      ),
    ];
  }

  let configText: string;

  try {
    configText = await Deno.readTextFile(pathToConfig);
  } catch (errorReadingFile) {
    return [
      new ErrOut(
        [
          ccolors.error("could not read"),
          ccolors.key_name(`cndi_config.yaml`),
          ccolors.error("file at"),
          ccolors.user_input(`"${pathToConfig}"`),
        ],
        {
          code: 504,
          id: "loadCndiConfig/read-text-error",
          metadata: {
            pathToConfig,
          },
          label,
          cause: errorReadingFile as Error,
        },
      ),
    ];
  }

  let config: CNDIConfig;

  try {
    config = YAML.parse(configText) as CNDIConfig;
  } catch (errorParsingFile) {
    return [
      new ErrOut(
        [
          ccolors.error("could not parse"),
          ccolors.key_name(`cndi_config.yaml`),
          ccolors.error("file at"),
          ccolors.user_input(`"${pathToConfig}"`),
        ],
        {
          code: 1300,
          id: "loadCndiConfig/parse-yaml-error",
          metadata: {
            pathToConfig,
          },
          label,
          cause: errorParsingFile as Error,
        },
      ),
    ];
  }

  return [undefined, { config, pathToConfig }];
};

// TODO: the following 2 functions can fail in 2 ways

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
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

function getTFModule(
  module_type: string,
  content: Record<never, never>,
  resourceName?: string,
) {
  const name = resourceName ? resourceName : `cndi_${module_type}`;
  return {
    module: {
      [name]: {
        ...content,
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

function getStagingDirectory(): PxResult<string> {
  const stagingDirectory = Deno.env.get("CNDI_STAGING_DIRECTORY");
  if (!stagingDirectory) {
    return [
      new ErrOut(
        [
          ccolors.error("internal error!"),
          ccolors.error("Environment Variable"),
          ccolors.key_name("CNDI_STAGING_DIRECTORY"),
          ccolors.error("is not defined"),
        ],
        {
          label: "src/utils.ts",
          code: 202,
          id: "getStagingDirectory/!env.CNDI_STAGING_DIRECTORY",
        },
      ),
    ];
  }
  return [undefined, stagingDirectory];
}

// MUST be called after all other terraform files have been staged
async function patchAndStageTerraformFilesWithInput(
  input: TFBlocks,
): Promise<ErrOut | void> {
  const pathToTerraformObject = path.join("cndi", "terraform", "cdk.tf.json");

  const [err, stagingDirectory] = getStagingDirectory();

  if (err) return err;

  const cdktfObj = (await loadJSONC(
    path.join(stagingDirectory, pathToTerraformObject),
  )) as TFBlocks;

  // this is highly inefficient
  const cdktfWithEmpties = {
    ...cdktfObj,
    resource: deepMerge(cdktfObj?.resource || {}, input?.resource || {}),
    terraform: deepMerge(cdktfObj?.terraform || {}, input?.terraform || {}),
    variable: deepMerge(cdktfObj?.variable || {}, input?.variable || {}),
    locals: deepMerge(cdktfObj?.locals || {}, input?.locals || {}),
    output: deepMerge(cdktfObj?.output || {}, input?.output || {}),
    module: deepMerge(cdktfObj?.module || {}, input?.module || {}),
    data: deepMerge(cdktfObj?.data || {}, input?.data || {}),
    provider: deepMerge(cdktfObj?.provider || {}, input?.provider || {}),
  };

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(cdktfWithEmpties)) {
    if (Object.keys(value).length) {
      output[key] = value;
    }
  }

  const errorStagingTFObj = await stageFile(
    pathToTerraformObject,
    getPrettyJSONString(output),
  );

  if (errorStagingTFObj) {
    return errorStagingTFObj;
  }
}

function getPathToTerraformBinary() {
  const DEFAULT_CNDI_HOME = path.join(homedir(), ".cndi");
  const CNDI_HOME = Deno.env.get("CNDI_HOME") || DEFAULT_CNDI_HOME;

  const fileSuffixForPlatform = getFileSuffixForPlatform();
  const pathToTerraformBinary = path.join(
    CNDI_HOME,
    "bin",
    `terraform-cndi${fileSuffixForPlatform}`,
  );
  return pathToTerraformBinary;
}

function getPathToKubesealBinary() {
  const DEFAULT_CNDI_HOME = path.join(homedir(), ".cndi");
  const CNDI_HOME = Deno.env.get("CNDI_HOME") || DEFAULT_CNDI_HOME;
  const fileSuffixForPlatform = getFileSuffixForPlatform();
  const pathToKubesealBinary = path.join(
    CNDI_HOME,
    "bin",
    `kubeseal-cndi${fileSuffixForPlatform}`,
  );
  return pathToKubesealBinary;
}

function resolveCNDIPorts(config: CNDIConfig): CNDIPort[] {
  const user_ports = config.infrastructure?.cndi?.open_ports ?? [];

  const ports: CNDIPort[] = [...DEFAULT_OPEN_PORTS];

  user_ports.forEach((user_port) => {
    if (user_port?.disable) {
      const indexOfPortToRemove = ports.findIndex(
        (port) =>
          user_port.number === port.number || user_port.name === port.name,
      );
      if (indexOfPortToRemove > -1) {
        ports.splice(indexOfPortToRemove, 1);
      }
      return;
    }

    const { name, number } = user_port;

    ports.push({
      name,
      number,
    });
  });
  return ports;
}

async function stageFile(
  relativePath: string,
  fileContents: string,
): Promise<ErrOut | void> {
  const [err, stagingDirectory] = getStagingDirectory();
  if (err) return err;
  const stagingPath = path.join(stagingDirectory, relativePath);
  try {
    await Deno.mkdir(path.dirname(stagingPath), { recursive: true });
    await Deno.writeTextFile(stagingPath, fileContents);
  } catch (errorStaging) {
    return new ErrOut(
      [ccolors.error("failed to stage file at"), ccolors.key_name(stagingPath)],
      {
        cause: errorStaging as Error,
        code: 508,
        label,
        id: "!stageFile",
      },
    );
  }
}

async function stageDirectory(
  relativePathOut: string,
  relativePathIn: string,
): Promise<ErrOut | void> {
  const [err, stagingDirectory] = getStagingDirectory();

  if (err) return err;

  try {
    const inputPath = path.join(Deno.cwd(), relativePathIn);
    const outputPath = path.join(stagingDirectory, relativePathOut);
    await copy(inputPath, outputPath); // fail if the output directory already exists
  } catch (errorStaging) {
    return new ErrOut([ccolors.error("failed to stage directory")], {
      cause: errorStaging as Error,
      code: 509,
      label,
      id: "!stageDirectory",
    });
  }
}

async function checkDirectoryForFileSuffix(directory: string, suffix: string) {
  try {
    for await (const entry of walk(directory)) {
      if (entry.isFile && entry.name.endsWith(suffix)) {
        return true;
      }
    }
  } catch {
    // directory doesn't exist
  }
  return false;
}
type CDKTFAppConfig = {
  outdir: string;
};

async function getCDKTFAppConfig(): Promise<PxResult<CDKTFAppConfig>> {
  const [err, stagingDirectory] = getStagingDirectory();
  if (err) return [err];

  const outdir = path.join(stagingDirectory, "cndi", "terraform");
  try {
    await Deno.mkdir(outdir, { recursive: true });
  } catch (errorCreatingDirectory) {
    return [
      new ErrOut(
        [
          ccolors.error("failed to create staging directory for terraform at"),
          ccolors.key_name(outdir),
        ],
        {
          cause: errorCreatingDirectory as Error,
          code: 510,
          label,
          id: "!getCDKTFAppConfig",
        },
      ),
    ];
  }
  return [undefined, { outdir }];
}

type PersistStagedFilesOptions = {
  purge: string[]; // a list of subpaths to purge from the target directory
};

async function persistStagedFiles(
  targetDirectory: string,
  opt?: PersistStagedFilesOptions,
): Promise<ErrOut | void> {
  const purge = opt?.purge || [];

  const [err, stagingDirectory] = getStagingDirectory();

  for (const relPath of purge) {
    try {
      await Deno.remove(path.join(targetDirectory, relPath), {
        recursive: true,
      });
    } catch {
      // directory doesn't exist
    }
  }

  if (err) return err;

  for await (const entry of walk(stagingDirectory)) {
    if (entry.isFile) {
      const destinationAbsPath = entry.path.replace(
        stagingDirectory,
        targetDirectory,
      );

      try {
        await Deno.mkdir(path.dirname(destinationAbsPath), { recursive: true });
      } catch {
        // directory exists already
      }

      await Deno.copyFile(entry.path, destinationAbsPath);
    }
  }
  await Deno.remove(stagingDirectory, { recursive: true });
}

async function checkInstalled(CNDI_HOME: string) {
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

function checkForRequiredMissingCreateRepoValues(
  responses: Record<string, CNDITemplatePromptResponsePrimitive>,
): string[] {
  const git_credentials_mode = responses?.git_credentials_mode || "token";

  const requiredKeys = ["git_username", "git_repo"];

  if (git_credentials_mode === "token") {
    requiredKeys.push("git_token");
  } else if (git_credentials_mode === "ssh") {
    requiredKeys.push("git_ssh_private_key");
  }

  const missingKeys: Array<string> = [];

  for (const key of requiredKeys) {
    const envVarName = key.toUpperCase();
    const missingValue = (!responses[key] && !Deno.env.get(envVarName)) ||
      Deno.env.get(envVarName) === `__${envVarName}_PLACEHOLDER__`;

    if (missingValue) {
      missingKeys.push(key);
    }
  }
  return missingKeys;
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
    linux: "",
    darwin: "",
    win32: ".exe",
  };
  const currentPlatform = platform() as "linux" | "darwin" | "win32";
  return fileSuffixForPlatform[currentPlatform];
};

const getCndiInstallPath = (): string => {
  const DEFAULT_CNDI_HOME = path.join(homedir(), ".cndi");
  const CNDI_HOME = Deno.env.get("CNDI_HOME") || DEFAULT_CNDI_HOME;
  let suffix = "";
  if (platform() === "win32") {
    suffix = ".exe";
  }
  return path.join(CNDI_HOME, "bin", `cndi${suffix}`);
};

function getUserDataTemplateFileString(
  role?: NodeRole,
  doBase64Encode?: boolean,
) {
  let leaderString =
    `templatefile("microk8s-cloud-init-leader.yml.tftpl",{"bootstrap_token": "\${local.bootstrap_token}", "git_repo": "\${var.git_repo}", "git_token": "\${var.git_token}", "git_username": "\${var.git_username}", "sealed_secrets_private_key": "\${base64encode(var.sealed_secrets_private_key)}", "sealed_secrets_public_key": "\${base64encode(var.sealed_secrets_public_key)}", "argocd_admin_password": "\${var.argocd_admin_password}"})`;
  if (useSshRepoAuth()) {
    // this value contains base64 encoded values for git_repo and git_ssh_private_key
    // it's required in order to support multiline values in cloud-init
    leaderString =
      `templatefile("microk8s-cloud-init-leader.yml.tftpl",{"bootstrap_token": "\${local.bootstrap_token}", "git_repo_encoded": "\${base64encode(var.git_repo)}", "git_repo": "\${var.git_repo}", "git_ssh_private_key": "\${base64encode(var.git_ssh_private_key)}", "sealed_secrets_private_key": "\${base64encode(var.sealed_secrets_private_key)}", "sealed_secrets_public_key": "\${base64encode(var.sealed_secrets_public_key)}", "argocd_admin_password": "\${var.argocd_admin_password}"})`;
  }
  let workerString =
    `templatefile("microk8s-cloud-init-worker.yml.tftpl",{"bootstrap_token": "\${local.bootstrap_token}", "leader_node_ip": "\${local.leader_node_ip}"})`;
  let controllerString =
    `templatefile("microk8s-cloud-init-controller.yml.tftpl",{"bootstrap_token": "\${local.bootstrap_token}", "leader_node_ip": "\${local.leader_node_ip}"})`;

  if (doBase64Encode) {
    leaderString = `\${base64encode(${leaderString})}`;
    workerString = `\${base64encode(${workerString})}`;
    controllerString = `\${base64encode(${controllerString})}`;
  } else {
    leaderString = `\${${leaderString}}`;
    workerString = `\${${workerString}}`;
    controllerString = `\${${controllerString}}`;
  }

  switch (role) {
    case "leader":
      return leaderString;
    case "worker":
      return workerString;
    default:
      return controllerString;
  }
}

/**
 * Replaces a range in a string with a substituted value
 * @param s string which should be modified
 * @param start index of the first character to be replaced
 * @param end index of the last character to be replaced
 * @param substitute
 * @returns new string after substitution
 */
function replaceRange(
  s: string,
  start: number,
  end: number,
  substitute: string,
) {
  return s.substring(0, start) + substitute + s.substring(end);
}

function useSshRepoAuth(): boolean {
  return (
    !!Deno.env.get("GIT_SSH_PRIVATE_KEY")?.length && !Deno.env.get("GIT_TOKEN")
  );
}

const getErrorDiscussionLinkMessageForCode = (code: number): string => {
  const codeObj = error_code_reference.find((e) => {
    return e.code === code;
  });
  return codeObj?.discussion_link
    ? `\ndiscussion: ${ccolors.prompt(codeObj.discussion_link)}`
    : "";
};

function absolutifyPath(p: string): string {
  if (path.isAbsolute(p)) {
    return p;
  }

  if (p.startsWith("~")) {
    return path.join(homedir(), p.slice(1));
  }

  return path.resolve(p);
}

// used to take a user provided filesystem path and return the absolute path
const getProjectDirectoryFromFlag = (value: string): string => {
  // only executed if the flag is provided
  return !value ? Deno.cwd() : absolutifyPath(value);
};

function getPathToCndiBinary() {
  const DEFAULT_CNDI_HOME = path.join(homedir(), ".cndi");
  const CNDI_HOME = Deno.env.get("CNDI_HOME") || DEFAULT_CNDI_HOME;
  let suffix = "";
  if (platform() === "win32") {
    suffix = ".exe";
  }
  return path.join(CNDI_HOME, "bin", `cndi${suffix}`);
}

function isSlug(input: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(input);
}

export {
  checkDirectoryForFileSuffix,
  checkForRequiredMissingCreateRepoValues,
  checkInitialized,
  checkInstalled,
  emitExitEvent,
  getCDKTFAppConfig,
  getCndiInstallPath,
  getFileSuffixForPlatform,
  getPathToCndiBinary,
  getPathToKubesealBinary,
  getPathToTerraformBinary,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
  getStagingDirectory,
  getTaintEffectForDistribution,
  getTFData,
  getTFModule,
  getTFResource,
  getUserDataTemplateFileString,
  getYAMLString,
  isSlug,
  loadCndiConfig,
  loadJSONC,
  patchAndStageTerraformFilesWithInput,
  persistStagedFiles,
  removeOldBinaryIfRequired,
  replaceRange,
  resolveCNDIPorts,
  sha256Digest,
  stageDirectory,
  stageFile,
  useSshRepoAuth,
};
