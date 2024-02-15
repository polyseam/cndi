import cndi from "src/cndi.ts";

if (import.meta.main) {
  console.log(""); // pad output
  await cndi();
  // await emitExitEvent(0);
}
