import { assert, describe, it } from "test-deps";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("cndi init command", () => {
  it("should create readme beginning with project_name when specified in --set", async () => {
    const cwd = await Deno.makeTempDir();

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
});
