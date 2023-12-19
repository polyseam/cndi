import * as esbuild from "https://deno.land/x/esbuild@v0.19.2/mod.js";
// Import the WASM build on platforms where running subprocesses is not
// permitted, such as Deno Deploy, or when running without `--allow-run`.
// import * as esbuild from "https://deno.land/x/esbuild@v0.19.2/wasm.js";

import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";

const result = await esbuild.build({
  plugins: [...denoPlugins({
    configPath:"./deno.json",
    importMapURL: "file:///Users/m/dev/polyseam/cndi/import_map.json"
  })],
  entryPoints: ["./main.ts"],
  outfile: "./dist/bytes.esm.js",
  bundle: true,
  format: "esm",
});

console.log(result.outputFiles);

esbuild.stop();
