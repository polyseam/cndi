import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

describe("testing framework", () => {
  it("should always be executed with CNDI_TELEMETRY='DEBUG' mode", () => {
    const value = Deno.env.get("CNDI_TELEMETRY");
    console.log("value", value);
    assert(value === "DEBUG");
    // assert(true);
  });
});
