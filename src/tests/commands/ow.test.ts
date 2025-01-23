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

import getProjectRoot from "get-project-root";

const ogDir = getProjectRoot();

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
      const { before, after } = await listFilepathsBeforeAndAfter(async () => {
        const { status } = await runCndi("ow");
        assert(status.success);
      });
      assert(setsAreEquivalent(new Set(before), new Set(after)));
    });

    await t.step("cleanup", cleanup);
  },
);

Deno.test(
  "'cndi ow' should not create cndi-run GitHub workflow for 'dev' provider",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
      await runCndi("init", "-t", "basic", "-l", "dev/microk8s");
    });

    await t.step("test", async () => {
      const filepaths = await listAllFilePaths(dir);
      const pathToCndiRunWorkflow = path.join(
        ".github",
        "workflows",
        "cndi-run.yaml",
      );
      assert(!filepaths.includes(pathToCndiRunWorkflow));
    });

    await t.step("cleanup", cleanup);
  },
);

Deno.test(`'cndi ow' should successfully convert secrets if correctly defined`, async (t) => {
  let dir = "";
  await t.step("setup", async () => {
    dir = await Deno.makeTempDir();
    Deno.chdir(dir);
    await runCndi("init", "-t", "basic", "-l", "aws/eks");
  });

  await t.step("test", async () => {
    const { before, after } = await listFilepathsBeforeAndAfter(async () => {
      const [errorLoadingConfig, result] = await loadCndiConfig(dir);

      if (errorLoadingConfig) {
        assert(false, errorLoadingConfig.message);
      }

      Deno.env.set("FOOSECRET", "realstring");

      const { config } = result;
      config.cluster_manifests["new-secret"] = {
        kind: "Secret",
        metadata: {
          name: "my-secret",
        },
        stringData: {
          password: "$cndi_on_ow.seal_secret_from_env_var(FOOSECRET)",
        },
      };
      config.cluster_manifests["new-secret-yet-to-be-defined"] = {
        kind: "Secret",
        metadata: {
          name: "my-secret-2",
        },
        stringData: {
          // BAR_SECRET will not be defined and should be included in .env with a placeholder
          magic: "$cndi_on_ow.seal_secret_from_env_var(BAR_SECRET)",
        },
      };

      await Deno.writeTextFile(
        `${dir}/cndi_config.yaml`,
        YAML.stringify(config),
      );
      await runCndi("ow");
    });

    const beforeSet = new Set(before);
    const afterSet = new Set(after);

    const added = afterSet.difference(beforeSet);
    const _removed = beforeSet.difference(afterSet);

    const expectedToAdd = new Set([
      path.join("cndi", "cluster_manifests", "new-secret.yaml"),
      // new-secret-yet-to-be-defined will update .env with a placeholder, but not yield a secret
    ]);

    assert(setsAreEquivalent(added, expectedToAdd));
    const dotenv = await Deno.readTextFile(path.join(dir, ".env"));
    assert(dotenv.includes("BAR_SECRET"));
  });

  await t.step("cleanup", cleanup);
});

Deno.test(
  `'cndi ow' should fail if secrets use plaintext in their definition`,
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
      await runCndi("init", "-t", "basic", "-l", "aws/eks");
    });

    await t.step("test", async () => {
      const { before, after } = await listFilepathsBeforeAndAfter(async () => {
        const [errorLoadingConfig, result] = await loadCndiConfig(dir);

        if (errorLoadingConfig) {
          assert(false, errorLoadingConfig.message);
        }

        const { config } = result;
        config.cluster_manifests["new-secret"] = {
          kind: "Secret",
          metadata: {
            name: "my-secret",
          },
          stringData: {
            password: "plaintext",
          },
        };
        await Deno.writeTextFile(
          `${dir}/cndi_config.yaml`,
          YAML.stringify(config),
        );
        await runCndi("ow");
      });
      assert(setsAreEquivalent(new Set(before), new Set(after)));
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
        const [errorLoadingConfig, result] = await loadCndiConfig(dir);

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
