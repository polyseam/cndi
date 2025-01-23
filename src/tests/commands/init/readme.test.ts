import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

import getProjectRoot from "get-project-root";

const ogDir = getProjectRoot();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init' should create a readme that begins with the 'project_name' if specified in --set",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const project_name = "foobar-proj";
      const { status } = await runCndi(
        "init",
        "-t",
        "basic",
        "--set",
        `project_name=${project_name}`,
        "--set",
        "deployment_target_provider=azure",
      );

      const readme = await Deno.readTextFile(`README.md`);
      assert(status.success);
      assert(readme.startsWith(`# ${project_name}`));
    });
    await t.step("cleanup", cleanup);
  },
);
