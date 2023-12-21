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

import { CNDIConfig, CNDIPort, NodeRole, TFBlocks } from "src/types.ts";

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

const loadYAMLorJSONC = async (
  filePath: string,
): Promise<JSONC.JsonValue | unknown> => {
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    return await loadYAML(filePath);
  }
  if (filePath.endsWith(".jsonc") || filePath.endsWith(".json")) {
    return await loadJSONC(filePath);
  }
};

const removeOldBinaryIfRequired = async (
  CNDI_HOME: string,
): Promise<boolean> => {
  const isWindows = platform() === "win32";
  const pathToGarbageBinary = isWindows
    ? path.join(CNDI_HOME, "bin", "cndi-old.exe")
    : path.join(CNDI_HOME, "bin", "cndi-old");

  try {
    await Deno.remove(pathToGarbageBinary);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error(
        utilsLabel,
        ccolors.error("\nfailed to delete old"),
        ccolors.key_name("cndi"),
        ccolors.error("binary, please try again"),
      );
      console.log(ccolors.caught(error, 302));
      await emitExitEvent(302);
      Deno.exit(302);
    }
    return false;
  }
  return true;
};

// attempts to find cndi_config.yaml or cndi_config.jsonc, then returns its value and location
const loadCndiConfig = async (
  providedPath?: string,
): Promise<[CNDIConfig, string]> => {
  let pathToConfig;
  let configIsYAML = true;
  const isFile = true;
  const cwd = Deno.cwd();

  // the user provided a direct path to a cndi_config file
  if (providedPath) {
    return [(await loadYAMLorJSONC(providedPath)) as CNDIConfig, providedPath];
  }

  if (await exists(path.join(cwd, "cndi_config.yaml"), { isFile })) {
    pathToConfig = path.join(cwd, "cndi_config.yaml");
  } else if (await exists(path.join(cwd, "cndi_config.yml"), { isFile })) {
    pathToConfig = path.join(cwd, "cndi_config.yml");
  } else if (await exists(path.join(cwd, "cndi_config.jsonc"), { isFile })) {
    pathToConfig = path.join(cwd, "cndi_config.jsonc");
    configIsYAML = false;
  } else if (await exists(path.join(cwd, "cndi_config.json"), { isFile })) {
    pathToConfig = path.join(cwd, "cndi_config.json");
    configIsYAML = false;
  } else {
    console.error(
      utilsLabel,
      ccolors.error("there is no"),
      ccolors.key_name('"cndi_config.yaml"'),
      ccolors.error("file in your current directory"),
    );
    console.log(
      "if you don't have a cndi_config file try",
      ccolors.prompt("cndi init --interactive"),
    );
    await emitExitEvent(500);
    Deno.exit(500);
  }
  try {
    const config = configIsYAML
      ? await loadYAML(pathToConfig)
      : await loadJSONC(pathToConfig);
    return [config as CNDIConfig, pathToConfig];
  } catch (error) {
    console.error(
      utilsLabel,
      ccolors.error("your cndi config file at"),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("is not valid"),
    );
    ccolors.caught(error, 504);
    await emitExitEvent(504);
    Deno.exit(504);
  }
};

// TODO: the following 2 functions can fail in 2 ways

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

// helper function to load a YAML file
const loadYAML = async (path: string) => {
  return YAML.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
}

async function getLeaderNodeNameFromConfig(
  config: CNDIConfig,
): Promise<string> {
  try {
    return config.infrastructure.cndi.nodes[0].name;
  } catch {
    console.error(
      utilsLabel,
      ccolors.error("cndi_config exists"),
      ccolors.error("but we could not assign a named node as leader"),
    );
    await emitExitEvent(200);
    Deno.exit(200);
  }
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
    `terraform-${fileSuffixForPlatform}`,
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
    `kubeseal-${fileSuffixForPlatform}`,
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

type CDKTFAppConfig = {
  outdir: string;
};

async function getCDKTFAppConfig(): Promise<CDKTFAppConfig> {
  const stagingDirectory = await getStagingDir();
  const outdir = path.join(stagingDirectory, "cndi", "terraform");
  await Deno.mkdir(path.dirname(outdir), { recursive: true });
  return {
    outdir,
  };
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
  const DEFAULT_CNDI_HOME = path.join(homedir(), ".cndi");
  const CNDI_HOME = Deno.env.get("CNDI_HOME") || DEFAULT_CNDI_HOME;
  let suffix = "";
  if (platform() === "win32") {
    suffix = ".exe";
  }
  return path.join(CNDI_HOME, "bin", `cndi${suffix}`);
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

function getSecretOfLength(len = 32): string {
  if (len % 2) {
    throw new Error("password length must be even");
  }

  const values = new Uint8Array(len / 2);
  crypto.getRandomValues(values);
  return Array.from(values, base10intToHex).join("");
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
  if (exit_code) console.log(getErrorDiscussionLinkMessageForCode(exit_code));
  if (isDebug) console.log("\nevent_uuid", event_uuid);
  console.log();
}

export {
  checkInitialized,
  checkInstalled,
  emitExitEvent,
  getCDKTFAppConfig,
  getCndiInstallPath,
  getFileSuffixForPlatform,
  getLeaderNodeNameFromConfig,
  getPathToKubesealBinary,
  getPathToOpenSSLForPlatform,
  getPathToTerraformBinary,
  getPrettyJSONString,
  getSecretOfLength,
  getStagingDir,
  getTFData,
  getTFModule,
  getTFResource,
  getUserDataTemplateFileString,
  getYAMLString,
  loadCndiConfig,
  loadJSONC,
  loadYAML,
  patchAndStageTerraformFilesWithInput,
  persistStagedFiles,
  removeOldBinaryIfRequired,
  replaceRange,
  resolveCNDIPorts,
  sha256Digest,
  stageFile,
  useSshRepoAuth,
};
