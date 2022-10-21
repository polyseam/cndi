import * as JSONC from "https://deno.land/std@0.157.0/encoding/jsonc.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { platform } from "https://deno.land/std@0.157.0/node/os.ts";

import { CNDIContext } from "./types.ts";
// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
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

export {
  checkInitialized,
  checkInstalled,
  getFileSuffixForPlatform,
  getPrettyJSONString,
  loadJSONC,
};
