import cndi from "src/cndi.ts";

if (import.meta.main) {
  console.log(""); // pad output
  await cndi();
  console.log(""); // pad output
}
