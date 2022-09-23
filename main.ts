import cndi from "./src/cndi.ts";

if (import.meta.main) {
  cndi(Deno.args);
}
