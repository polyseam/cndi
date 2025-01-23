import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { hasSameFilesAfter } from "src/tests/helpers/util.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init' without any flags or config files present should fail",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init", "-d");

          assert(!status.success);
        }),
      );
    });
    await t.step("cleanup", cleanup);
  },
);
