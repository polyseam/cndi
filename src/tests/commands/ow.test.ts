import { assert } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import {
  listChangedFilePaths,
  setsAreEquivalent,
} from "src/tests/helpers/util.ts";

import { loadCndiConfig } from "src/utils.ts";
import { path, YAML } from "src/deps.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi ow' should do nothing if no config or inputs have changed",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
      await runCndi("init", "-t", "basic", "-l", "aws/eks");
    });

    await t.step("test", async () => {
      const changedFilePaths = await listChangedFilePaths(async () => {
        const { status } = await runCndi("ow");
        assert(status.success);
      });
      assert(changedFilePaths.length === 0);
    });

    await t.step("cleanup", cleanup);
  },
);

Deno.test(
  "'cndi ow' should create a manifest file if one has been added to config",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
      await runCndi("init", "-t", "basic", "-l", "aws/eks");
    });

    await t.step("test", async () => {
      const changedFilePaths = await listChangedFilePaths(async () => {
        const { config } = await loadCndiConfig(dir);
        config.cluster_manifests["new-ns"] = {
          kind: "Namespace",
          metadata: {
            name: "new-ns",
          },
        };
        await Deno.writeTextFile(
          `${dir}/cndi_config.yaml`,
          YAML.stringify(config),
        );
        await runCndi("ow");
      });
      assert(changedFilePaths.length === 1);
    });

    await t.step("cleanup", cleanup);
  },
);

Deno.test(
  "'cndi ow' should bootstrap functions if source typescript is provided",
  async (t) => {
    const filePathsCreatedForFunctions = new Set([
      path.join("cndi", "functions", "Dockerfile"),
      path.join("cndi", "functions", "src", "hello", "index.ts"),
      path.join("cndi", "functions", "src", "main", "index.ts"),
      path.join("cndi", "cluster_manifests", "fns-pull-secret.yaml"),
      path.join("cndi", "cluster_manifests", "fns-deployment.yaml"),
      path.join("cndi", "cluster_manifests", "fns-env-secret.yaml"),
      path.join("cndi", "cluster_manifests", "fns-namespace.yaml"),
      path.join("cndi", "cluster_manifests", "fns-service.yaml"),
      path.join(".github", "workflows", "cndi-fns.yaml"),
      path.join("functions", "hello", "index.ts"),
    ]);

    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
      await runCndi(
        "init",
        "-t",
        "basic",
        "-l",
        "aws/eks",
        "--set",
        "git_repo=https://github.com/polyseam/example-repo",
      );
    });

    await t.step("test", async () => {
      const changedFilePaths = await listChangedFilePaths(async () => {
        await Deno.mkdir(`./functions/hello`, { recursive: true });
        await Deno.writeTextFile(
          path.join("functions", "hello", "index.ts"),
          `Deno.serve(() => (new Response('', { status: 200 })));`,
          { create: true },
        );
        const { status } = await runCndi("ow");
        assert(status.success);
      });
      const changedFilePathsSet = new Set(changedFilePaths);

      assert(
        setsAreEquivalent(filePathsCreatedForFunctions, changedFilePathsSet),
      );
    });

    await t.step("cleanup", cleanup);
  },
);
