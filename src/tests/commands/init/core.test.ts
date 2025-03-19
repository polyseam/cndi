import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { hasSameFilesAfter } from "src/tests/helpers/util.ts";

describe("cndi init command", () => {
  it("should fail without any flags or config files present", async () => {
    const cwd = await Deno.makeTempDir();

    assert(
      await hasSameFilesAfter(async () => {
        const { status } = await runCndi({ args: ["init", "-d"], cwd });

        assert(!status.success);
      }),
    );
  });
});
