import cndi from "./src/cndi.ts";

if (import.meta.main) {
  await cndi(Deno.args);
}
