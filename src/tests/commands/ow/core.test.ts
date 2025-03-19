import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

import {
  listAllFilePaths,
  listChangedFilePaths,
  listFilepathsBeforeAndAfter,
  setsAreEquivalent,
} from "src/tests/helpers/util.ts";

import { loadCndiConfig } from "src/utils.ts";
import { path, YAML } from "src/deps.ts";

describe("cndi ow command", () => {
  it("should do nothing if no config or inputs have changed", async () => {
    const cwd = await Deno.makeTempDir();

    // Setup
    await runCndi({
      args: ["init", "-t", "basic", "-l", "aws/eks"],
      cwd,
    });

    // Test
    const { before, after } = await listFilepathsBeforeAndAfter(async () => {
      const { status } = await runCndi({ args: ["ow"], cwd });
      assert(status.success);
    }, cwd);
    assert(setsAreEquivalent(new Set(before), new Set(after)));
  });

  it("should not create cndi-run GitHub workflow for 'dev' provider", async () => {
    const cwd = await Deno.makeTempDir();

    // Setup
    await runCndi({
      args: ["init", "-t", "basic", "-l", "dev/microk8s "],
      cwd,
    });

    // Test
    const filepaths = await listAllFilePaths(cwd);
    const pathToCndiRunWorkflow = path.join(
      ".github",
      "workflows",
      "cndi-run.yaml",
    );
    assert(!filepaths.includes(pathToCndiRunWorkflow));
  });

  it("should create a manifest file if one has been added to config", async () => {
    const cwd = await Deno.makeTempDir();

    // Setup
    await runCndi({ args: ["init", "-t", "basic", "-l", "aws/eks"], cwd });

    // Test
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
});
