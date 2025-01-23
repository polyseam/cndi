import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -t basic -l azure/microk8s should succeed",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      const { status } = await runCndi({
        args: ["init", "-t", "basic", "-l", "azure/microk8s"],
        cwd,
      });
      assert(status.success);
    });
  },
);
