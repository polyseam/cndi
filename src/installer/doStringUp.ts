import stringUp from "./stringUp.ts";

stringUp([
  "./src/bootstrap",
  "./src/github",
], `${Deno.cwd()}/src/installer/embedded/all.ts`);
