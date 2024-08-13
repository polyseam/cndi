import {
  ccolors,
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

import emitTelemetryEvent from "src/telemetry/telemetry.ts";

const utilsLabel = ccolors.faded("src/utils.ts:");

// YAML.stringify but easier to work with
function getYAMLString(object: unknown, skipInvalid = true): string {
  // if the object contains an undefined, skipInvalid will not write the key
  // skipInvalid: true is most similar to JSON.stringify
  return YAML.stringify(object as Record<string, unknown>, {
    skipInvalid,
  });
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

const getPathToCndiConfig = async (providedPath?: string): Promise<string> => {
  if (providedPath) {
    const normalized = path.normalize(providedPath);
    if (await exists(normalized)) {
      return normalized;
    } else {
      throw new Error(
        [
          utilsLabel,
          ccolors.error("could not find cndi_config file at"),
          ccolors.user_input(`"${providedPath}"`),
        ].join(" "),
        {
          cause: 500,
        },
      );
    }
  }

  if (await exists(path.join(Deno.cwd(), "cndi_config.yaml"))) {
    return path.join(Deno.cwd(), "cndi_config.yaml");
  } else if (await exists(path.join(Deno.cwd(), "cndi_config.yml"))) {
    return path.join(Deno.cwd(), "cndi_config.yml");
  } else {
    throw new Error(
      [
        utilsLabel,
        ccolors.error("there is no"),
        ccolors.key_name('"cndi_config.yaml"'),
        ccolors.error("file in your current directory"),
      ].join(" "),
      {
        cause: 500,
      },
    );
  }
};

const getTaintEffectForDistribution = (
  effect: CNDITaintEffect,
  distribution: CNDIDistribution,
) => {
  if (distribution === "aks") {
    return effect;
  } else {
    const effectMap = {
      "NoSchedule": "NO_SCHEDULE",
      "PreferNoSchedule": "PREFER_NO_SCHEDULE",
      "NoExecute": "NO_EXECUTE",
    };
    return effectMap[effect];
  }
};

// attempts to find cndi_config.yaml or cndi_config.jsonc, then returns its value and location
const loadCndiConfig = async (
  projectDirectory: string,
): Promise<{ config: CNDIConfig; pathToConfig: string }> => {
  let pathToConfig = path.join(projectDirectory, "cndi_config.yaml");

  if (!await exists(pathToConfig)) {
    pathToConfig = path.join(projectDirectory, "cndi_config.yml");
  }

  try {
    const config = await loadYAML(pathToConfig) as CNDIConfig;
    return { config, pathToConfig };
  } catch {
    throw new Error(
      [
        utilsLabel,
        ccolors.error("your cndi_config file at"),
        ccolors.user_input(`"${pathToConfig}"`),
        ccolors.error("could not be read"),
      ].join(" "),
      {
        cause: 504,
      },
    );
  }
};

// TODO: the following 2 functions can fail in 2 ways

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

// helper function to load a YAML file
const loadYAML = async (path: string) => {
  let txt: string;
  let y: unknown;
  try {
    txt = await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(
        [
          utilsLabel,
          ccolors.error("could not find file at"),
          ccolors.user_input(`"${path}"`),
        ].join(" "),
        {
          cause: 1301,
        },
      );
    }
    throw error;
  }

  try {
    y = await YAML.parse(txt);
  } catch {
    throw new Error(
      [
        utilsLabel,
        ccolors.error("could not parse file as YAML at"),
        ccolors.user_input(`"${path}"`),
      ].join(" "),
      {
        cause: 1300,
      },
    );
  }
  return y;
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

// MUST be called after all other terraform files have been staged
async function patchAndStageTerraformFilesWithInput(input: TFBlocks) {
  const pathToTerraformObject = path.join("cndi", "terraform", "cdk.tf.json");

  const cdktfObj = await loadJSONC(
    path.join(await getStagingDir(), pathToTerraformObject),
  ) as TFBlocks;

  // this is highly inefficient
  const cdktfWithEmpties = {
    ...cdktfObj,
    resource: deepMerge(
      cdktfObj?.resource || {},
      input?.resource || {},
    ),
    terraform: deepMerge(
      cdktfObj?.terraform || {},
      input?.terraform || {},
    ),
    variable: deepMerge(
      cdktfObj?.variable || {},
      input?.variable || {},
    ),
    locals: deepMerge(cdktfObj?.locals || {}, input?.locals || {}),
    output: deepMerge(cdktfObj?.output || {}, input?.output || {}),
    module: deepMerge(cdktfObj?.module || {}, input?.module || {}),
    data: deepMerge(cdktfObj?.data || {}, input?.data || {}),
    provider: deepMerge(
      cdktfObj?.provider || {},
      input?.provider || {},
    ),
  };

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(cdktfWithEmpties)) {
    if (Object.keys(value).length) {
      output[key] = value;
    }
  }

  await stageFile(
    pathToTerraformObject,
    getPrettyJSONString(output),
  );
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

async function stageFile(relativePath: string, fileContents: string) {
  const stagingPath = path.join(await getStagingDir(), relativePath);
  await Deno.mkdir(path.dirname(stagingPath), { recursive: true });
  await Deno.writeTextFile(stagingPath, fileContents);
}

async function copyDir(
  src: string,
  dest: string,
): Promise<void | Error> {
  try {
    // create the destination directory
    // fail and return if error if the destination directory already exists
    await Deno.mkdir(dest, { recursive: true });
    for await (const entry of Deno.readDir(src)) {
      const srcPath = `${src}/${entry.name}`;
      const destPath = `${dest}/${entry.name}`;
      if (entry.isFile) {
        await Deno.copyFile(srcPath, destPath);
      } else if (entry.isDirectory) {
        await copyDir(srcPath, destPath);
      }
    }
  } catch (error) {
    return error;
  }
}

async function stageDirectory(
  relativePathOut: string,
  relativePathIn: string,
): Promise<{ success: true } | Error> {
  try {
    const outputPath = path.join(await getStagingDir(), relativePathOut);
    const inputPath = path.join(Deno.cwd(), relativePathIn);
    await copyDir(inputPath, outputPath);
  } catch (error) {
    return error;
  }
  return { success: true };
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

async function getCDKTFAppConfig(): Promise<CDKTFAppConfig> {
  const stagingDirectory = getStagingDir();
  const outdir = path.join(stagingDirectory, "cndi", "terraform");
  await Deno.mkdir(path.dirname(outdir), { recursive: true });
  return {
    outdir,
  };
}

function getStagingDir(): string {
  const stagingDirectory = Deno.env.get("CNDI_STAGING_DIRECTORY");
  if (!stagingDirectory) {
    throw new Error(
      [
        utilsLabel,
        `${ccolors.key_name(`"CNDI_STAGING_DIRECTORY"`)}`,
        ccolors.error(`is not set!`),
      ].join(" "),
      { cause: 202 },
    );
  }
  return stagingDirectory;
}

async function persistStagedFiles(targetDirectory: string) {
  const stagingDirectory = getStagingDir();

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

  const requiredKeys = [
    "git_username",
    "git_repo",
  ];

  if (git_credentials_mode === "token") {
    requiredKeys.push("git_token");
  } else if (git_credentials_mode === "ssh") {
    requiredKeys.push("git_ssh_private_key");
  }

  const missingKeys: Array<string> = [];

  for (const key of requiredKeys) {
    const envVarName = key.toUpperCase();
    const missingValue = !responses[key] && !Deno.env.get(envVarName) ||
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

async function emitExitEvent(exit_code: number) {
  const event_uuid = await emitTelemetryEvent("command_exit", { exit_code });
  const isDebug = Deno.env.get("CNDI_TELEMETRY") === "debug";
  if (exit_code) console.error(getErrorDiscussionLinkMessageForCode(exit_code));
  if (isDebug) console.log("\nevent_uuid", event_uuid);
  console.log();
}

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
  copyDir,
  emitExitEvent,
  getCDKTFAppConfig,
  getCndiInstallPath,
  getFileSuffixForPlatform,
  getPathToCndiBinary,
  getPathToCndiConfig,
  getPathToKubesealBinary,
  getPathToTerraformBinary,
  getPrettyJSONString,
  getProjectDirectoryFromFlag,
  getStagingDir,
  getTaintEffectForDistribution,
  getTFData,
  getTFModule,
  getTFResource,
  getUserDataTemplateFileString,
  getYAMLString,
  isSlug,
  loadCndiConfig,
  loadJSONC,
  loadYAML,
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
