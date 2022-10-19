import * as JSONC from "https://deno.land/std@0.157.0/encoding/jsonc.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";

import { CNDIContext } from "./types.ts";
// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

function getPrettyJSONString(object: unknown) {
  return JSON.stringify(object, null, 2);
}

async function checkInstalled({
  binaryForPlatform,
  CNDI_HOME,
  CNDI_SRC,
}: CNDIContext) {
  const TERRAFORM_BINARY_PREFIX = "terraform-";
  const binaryPath = path.join(
    CNDI_HOME,
    `${TERRAFORM_BINARY_PREFIX}${binaryForPlatform}`
  );

  try {
    // if any of these files/folders don't exist, return false
    await Promise.all([
      Deno.stat(CNDI_HOME),
      Deno.stat(CNDI_SRC),
      Deno.stat(path.join(CNDI_SRC, "github")),
      Deno.stat(path.join(CNDI_SRC, "bootstrap")),
      Deno.stat(binaryPath),
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

export { checkInitialized, checkInstalled, loadJSONC, getPrettyJSONString };
