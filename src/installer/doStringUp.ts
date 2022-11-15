import stringUp from "./stringUp.ts";

stringUp([
  "./src/github",
  "./src/templates",
], `${Deno.cwd()}/src/installer/embedded/all.ts`);
