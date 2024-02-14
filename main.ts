import cndi from "src/cndi.ts";
import { emitExitEvent } from "./src/utils.ts";

if (import.meta.main) {
  console.log(""); // pad output
  await cndi();
  // await emitExitEvent(0);
}
