import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi create' should throw an error if the repo-slug argument contains invalid characters",
  async (t) => {
    let dir = "";

    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const result = await runCndi(
        "create",
        "owner.foo/repo",
        "-l",
        "aws/eks",
        "-t",
        "basic",
      );

      assert(result.status.success === false);
      assert(result.stderrOutput.includes("slug"));
    });

    await t.step("cleanup", cleanup);
  },
);
