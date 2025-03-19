import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import { hasSameFilesAfter } from "src/tests/helpers/util.ts";

describe("cndi init template", () => {
  it("'cndi init -t foo' should throw an error because 'foo' is not a valid template", async () => {
    const cwd = await Deno.makeTempDir();

    assert(
      await hasSameFilesAfter(async () => {
        const { status } = await runCndi({
          args: ["init", "-t", "foo"],
          cwd,
        });
        assert(!status.success);
      }),
    );
  });
  it("'cndi init -t https://example.com/does-not-exist.yaml' should throw an error because there is no template found there", async () => {
    const cwd = await Deno.makeTempDir();

    assert(
      await hasSameFilesAfter(async () => {
        const { status } = await runCndi({
          args: [
            "init",
            "-t",
            "https://example.com/does-not-exist.yaml",
          ],
          cwd,
        });
        assert(!status.success);
      }),
    );
  });
});
