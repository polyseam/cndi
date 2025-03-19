import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("AWS EKS initialization", () => {
  it("should succeed with basic template", async () => {
    const cwd = await Deno.makeTempDir();

    const { status } = await runCndi({
      args: ["init", "-t", "basic", "-l", "aws/eks"],
      cwd,
    });
    assert(status.success);
  });
});
