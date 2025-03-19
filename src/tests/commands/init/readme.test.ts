import { assert } from "test-deps";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

// Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init' should create a readme that begins with the 'project_name' if specified in --set",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      const project_name = "foobar-proj";
      const { status } = await runCndi({
        args: [
          "init",
          "-t",
          "basic",
          "--set",
          `project_name=${project_name}`,
          "--set",
          "deployment_target_provider=azure",
        ],
        cwd,
      });

      const readme = await Deno.readTextFile(path.join(cwd, `README.md`));
      assert(status.success);
      assert(readme.startsWith(`# ${project_name}`));
    });
  },
);
