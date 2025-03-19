import { assert, describe, it } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("cndi create command", () => {
  it("should throw an error if the repo-slug argument contains invalid characters", async () => {
    const cwd = await Deno.makeTempDir();

    const result = await runCndi({
      args: ["create", "owner.foo/repo", "-l", "aws/eks", "-t", "basic"],
      cwd,
    });

    assert(result.status.success === false);
    assert(result.stderrOutput.includes("slug"));
  });
});
