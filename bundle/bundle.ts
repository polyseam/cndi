import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.10.3";

const result = await esbuild.build({
  plugins: [
    ...denoPlugins({
      configPath: await Deno.realPath("deno.json"),
    }),
  ],
  entryPoints: ["main.ts", "src/actions/overwrite.worker.ts"],
  outdir: "./dist/js/",
  bundle: true,
  minify: true,
  format: "esm",
  sourcemap: false,
  treeShaking: true,
});

console.log(result.outputFiles);

esbuild.stop();
