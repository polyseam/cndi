import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -t basic -l aws/eks should succeed",
  async (t) => {
    const cwd = Deno.makeTempDirSync();

    await t.step("test", async () => {
      const { status } = await runCndi({
        args: ["init", "-t", "basic", "-l", "aws/eks"],
        cwd,
      });
      assert(status.success);
    });
  },
);
