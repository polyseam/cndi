import { assert, describe, it } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("AWS MicroK8s initialization", () => {
  it("should fail when targeting aws/microk8s with basic template", async () => {
    const cwd = await Deno.makeTempDir();

    const { status } = await runCndi({
      args: ["init", "-t", "basic", "-l", "aws/microk8s"],
      cwd,
    });
    assert(!status?.success);
  });
});
