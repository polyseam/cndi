import * as JSONC from "https://deno.land/std@0.173.0/encoding/jsonc.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { platform } from "https://deno.land/std@0.173.0/node/os.ts";
import { walk } from "https://deno.land/std@0.173.0/fs/mod.ts";
import { CNDIContext, NODE_KIND, NodeKind } from "./types.ts";
// helper function to load a JSONC file

const CERT_TOP = "-----BEGIN CERTIFICATE-----\n";
const CERT_BOTTOM = "\n-----END CERTIFICATE-----\n";
const PRIVATE_KEY_TOP = "-----BEGIN PRIVATE KEY-----\n";
const PRIVATE_KEY_BOTTOM = "\n-----END PRIVATE KEY-----\n";

const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
}

async function stageFile(
  stagingDirectory: string,
  relativePath: string,
  fileContents: string,
) {
  const stagingPath = path.join(stagingDirectory, relativePath);
  await Deno.mkdir(path.dirname(stagingPath), { recursive: true });
  await Deno.writeTextFile(stagingPath, fileContents);
}

function stageFileSync(
  stagingDirectory: string,
  relativePath: string,
  fileContents: string,
) {
  const stagingPath = path.join(stagingDirectory, relativePath);
  Deno.mkdirSync(path.dirname(stagingPath), { recursive: true });
  Deno.writeTextFileSync(stagingPath, fileContents);
}

async function persistStagedFiles(
  stagingDirectory: string,
  targetDirectory: string,
) {
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

async function checkInstalled({
  pathToTerraformBinary,
  CNDI_HOME,
  CNDI_SRC,
}: CNDIContext) {
  try {
    // if any of these files/folders don't exist, return false
    await Promise.all([
      Deno.stat(CNDI_HOME),
      Deno.stat(CNDI_SRC),
      Deno.stat(pathToTerraformBinary),
    ]);

    return true;
  } catch {
    return false;
  }
}

async function checkInitialized({
  projectCndiDirectory,
  githubDirectory,
  dotEnvPath,
}: CNDIContext) {
  // if any of these files/folders don't exist, return false
  try {
    await Promise.all([
      Deno.stat(projectCndiDirectory),
      Deno.stat(githubDirectory),
      Deno.stat(dotEnvPath),
    ]);
    return true;
  } catch {
    return false;
  }
}

const getFileSuffixForPlatform = () => {
  const fileSuffixForPlatform = {
    linux: "linux",
    darwin: "macos",
    win32: "win.exe",
  };
  const currentPlatform = platform() as "linux" | "darwin" | "win32";
  return fileSuffixForPlatform[currentPlatform];
};

const trimPemString = (key: string): string => {
  const trimmedKey = key
    .replace(CERT_TOP, "")
    .replace(CERT_BOTTOM, "")
    .replace(PRIVATE_KEY_BOTTOM, "")
    .replace(PRIVATE_KEY_TOP, "");
  return trimmedKey;
};

const padPrivatePem = (keyMaterial: string): string => {
  const paddedPrivateKey =
    `${PRIVATE_KEY_TOP}${keyMaterial}${PRIVATE_KEY_BOTTOM}`;
  return paddedPrivateKey;
};

const padPublicPem = (keyMaterial: string): string => {
  const paddedPublicKey = `${CERT_TOP}${keyMaterial}${CERT_BOTTOM}`;
  return paddedPublicKey;
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
  getDefaultVmTypeForKind,
  getFileSuffixForPlatform,
  getPathToOpenSSLForPlatform,
  getPrettyJSONString,
  getSecretOfLength,
  loadJSONC,
  padPrivatePem,
  padPublicPem,
  persistStagedFiles,
  stageFile,
  stageFileSync,
  trimPemString,
};
