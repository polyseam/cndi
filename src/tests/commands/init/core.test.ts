import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { hasSameFilesAfter } from "src/tests/helpers/util.ts";

// Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init' without any flags or config files present should fail",
  async (t) => {
    const cwd = await Deno.makeTempDir();
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi({ args: ["init", "-d"], cwd });

          assert(!status.success);
        }),
      );
    });
  },
);
