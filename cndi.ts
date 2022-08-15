import * as JSONC from "https://deno.land/std@0.152.0/encoding/jsonc.ts";
import * as flags from "https://deno.land/std@0.152.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.152.0/path/mod.ts";
import * as process from "https://deno.land/std@0.152.0/node/process.ts";


const DEFAULT_CNDI_CONFIG_PATH = path.join(Deno.cwd(), "cndi-config.json");
const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`

const cndiArguments = flags.parse(Deno.args);

const pathToConfig = cndiArguments.f || cndiArguments.file || DEFAULT_CNDI_CONFIG_PATH_JSONC|| DEFAULT_CNDI_CONFIG_PATH;

let config;

try{
    config = JSONC.parse(Deno.readTextFileSync(pathToConfig));
}catch(readFileError){
    console.dir(readFileError);
    process.exit(1);
}

console.log(config);