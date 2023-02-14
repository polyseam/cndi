import * as JSONC from "https://deno.land/std@0.173.0/encoding/jsonc.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { platform } from "https://deno.land/std@0.173.0/node/os.ts";
import { walk } from "https://deno.land/std@0.173.0/fs/mod.ts";
import { NODE_KIND, NodeKind } from "./types.ts";
import { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
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
    console.error(`${colors.yellow("CNDI_STAGING_DIRECTORY")} is not set!`);
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

async function checkInstalled() {
  try {
    const CNDI_HOME = Deno.env.get("CNDI_HOME")!;
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
  getPathToKubesealBinary,
  getPathToOpenSSLForPlatform,
  getPathToTerraformBinary,
  getPrettyJSONString,
  getSecretOfLength,
  getStagingDir,
  loadJSONC,
  persistStagedFiles,
  stageFile,
  stageFileSync,
};
