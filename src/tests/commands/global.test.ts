import { assert, describe, it } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("cndi global command", () => {
  it("should show help message when no subcommands are provided", async () => {
    const cwd = await Deno.makeTempDir();

    const { output } = await runCndi({
      args: [],
      cwd,
    });
    assert(output.includes("Usage:"));
  });
});
