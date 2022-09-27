import * as JSONC from "https://deno.land/std@0.157.0/encoding/jsonc.ts";

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

export { loadJSONC };
