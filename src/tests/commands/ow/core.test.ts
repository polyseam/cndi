import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import {
  listAllFilePaths,
  listChangedFilePaths,
  listFilepathsBeforeAndAfter,
  setsAreEquivalent,
} from "src/tests/helpers/util.ts";

import { loadCndiConfig } from "src/utils.ts";
import { path, YAML } from "src/deps.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi ow' should do nothing if no config or inputs have changed",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("setup", async () => {
      await runCndi({
        args: ["init", "-t", "basic", "-l", "aws/eks"],
        cwd,
      });
    });

    await t.step("test", async () => {
      const { before, after } = await listFilepathsBeforeAndAfter(async () => {
        const { status } = await runCndi({ args: ["ow"], cwd });
        assert(status.success);
      }, cwd);
      assert(setsAreEquivalent(new Set(before), new Set(after)));
    });
  },
);

Deno.test(
  "'cndi ow' should not create cndi-run GitHub workflow for 'dev' provider",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("setup", async () => {
      await runCndi({
        args: ["init", "-t", "basic", "-l", "dev/microk8s "],
        cwd,
      });
    });

    await t.step("test", async () => {
      const filepaths = await listAllFilePaths(cwd);
      const pathToCndiRunWorkflow = path.join(
        ".github",
        "workflows",
        "cndi-run.yaml",
      );
      assert(!filepaths.includes(pathToCndiRunWorkflow));
    });
  },
);

Deno.test(
  "'cndi ow' should create a manifest file if one has been added to config",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("setup", async () => {
      await runCndi({ args: ["init", "-t", "basic", "-l", "aws/eks"], cwd });
    });

    await t.step("test", async () => {
      const changedFilePaths = await listChangedFilePaths(async () => {
        const [errorLoadingConfig, result] = await loadCndiConfig(cwd);

        if (errorLoadingConfig) {
          assert(false, errorLoadingConfig.message);
        }

        const { config } = result;
        config.cluster_manifests["new-ns"] = {
          kind: "Namespace",
          metadata: {
            name: "new-ns",
          },
        };
        await Deno.writeTextFile(
          path.join(cwd, `cndi_config.yaml`),
          YAML.stringify(config),
        );
        await runCndi({ args: ["ow"], cwd });
      }, cwd);
      assert(changedFilePaths.length === 1);
    });
  },
);
