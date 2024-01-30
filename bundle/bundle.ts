import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.5/mod.ts";

const result = await esbuild.build({
  plugins: [
    {
      name: "json",

      // deno-lint-ignore no-explicit-any
      setup: (build: any) =>
        build.onLoad({ filter: /\.json$/ }, () => ({ loader: "json" })),
    },
    ...denoPlugins({
      configPath: await Deno.realPath("deno.json"),
    }),
  ],
  entryPoints: ["main.ts"],
  outfile: "./dist/cndi.esm.js",
  bundle: true,
  format: "esm",
  minify: true,
});

console.log(result.outputFiles);

esbuild.stop();
