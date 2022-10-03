import * as JSONC from "https://deno.land/std@0.157.0/encoding/jsonc.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";

import { CNDIContext } from "./types.ts";
// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

async function checkInstalled({
  binaryForPlatform,
  CNDI_HOME,
  CNDI_SRC,
}: CNDIContext) {
  const CNDI_BINARY_PREFIX = "cndi-node-runtime-setup-";
  const binaryPath = path.join(
    CNDI_HOME,
    `${CNDI_BINARY_PREFIX}${binaryForPlatform}`,
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
  outputDirectory,
  githubDirectory,
  dotEnvPath,
}: CNDIContext) {
  // if any of these files/folders don't exist, return false
  try {
    await Promise.all([
      Deno.stat(outputDirectory),
      Deno.stat(githubDirectory),
      Deno.stat(dotEnvPath),
    ]);
    return true;
  } catch {
    return false;
  }
}

export { checkInitialized, checkInstalled, loadJSONC };
