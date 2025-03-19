import { assert, describe, it } from "test-deps";

describe("testing framework", () => {
  it("should always be executed with CNDI_TELEMETRY='DEBUG' mode", () => {
    const value = Deno.env.get("CNDI_TELEMETRY");
    assert(value === "DEBUG");
  });
});
