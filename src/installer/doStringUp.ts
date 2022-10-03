import stringUp from "./stringUp.ts";

stringUp([
  "./src/bootstrap",
  //   "./src/cndi-node-runtime-setup/dist",
  "./src/github",
], `${Deno.cwd()}/src/installer/embedded/all.ts`);
