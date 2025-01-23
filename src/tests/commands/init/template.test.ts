import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import { hasSameFilesAfter } from "src/tests/helpers/util.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -t foo' should throw an error because 'foo' is not a valid template",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
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
  },
);

Deno.test(
  "'cndi init -t https://example.com/does-not-exist.yaml' should throw an error because there is no template found there",
  async (t) => {
    const cwd = await Deno.makeTempDir();
    await t.step("test", async () => {
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
  },
);
