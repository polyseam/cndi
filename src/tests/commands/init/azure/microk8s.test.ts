import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init -t basic -l azure/microk8s should succeed",
  async (t) => {
    let dir = "";

    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const { status } = await runCndi(
        "init",
        "-t",
        "basic",
        "-l",
        "azure/microk8s",
      );
      assert(status.success);
    });

    await t.step("cleanup", cleanup);
  },
);
