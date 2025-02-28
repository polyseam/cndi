import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi' should show help message when no subcommands are provided",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("setup", async () => {
      const { output } = await runCndi({
        args: [],
        cwd,
      });
      assert(output.includes("Usage:"));
    });
  },
);
