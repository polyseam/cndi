import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi create' should throw an error if the repo-slug argument contains invalid characters",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      const result = await runCndi({
        args: ["create", "owner.foo/repo", "-l", "aws/eks", "-t", "basic"],
        cwd,
      });

      assert(result.status.success === false);
      assert(result.stderrOutput.includes("slug"));
    });
  },
);
