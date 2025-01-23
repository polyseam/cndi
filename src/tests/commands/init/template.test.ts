import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import { hasSameFilesAfter } from "src/tests/helpers/util.ts";
Deno.env.set("CNDI_TELEMETRY", "debug");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init -t foo' should throw an error because 'foo' is not a valid template",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init -t foo"); // cndi init -t foo
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "'cndi init -t https://example.com/does-not-exist.yaml' should throw an error because there is no template found there",
  async (t) => {
    const dir = Deno.makeTempDirSync();
    Deno.chdir(dir);
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi(
            "init",
            "-t",
            "https://example.com/does-not-exist.yaml",
          );
          assert(!status.success);
        }),
      );
    });
    await t.step("cleanup", cleanup);
  },
);
