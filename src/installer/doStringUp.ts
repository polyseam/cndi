import stringUp from "./stringUp.ts";

stringUp(
  {
    directoryPaths: ["./src/github"],
    filePaths: ["./deno.jsonc"],
  },
  `${Deno.cwd()}/src/installer/embedded/all.ts`,
);
