import { assert, describe, it } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

import {
  listFilepathsBeforeAndAfter,
  setsAreEquivalent,
} from "src/tests/helpers/util.ts";

import { loadCNDIConfig } from "src/cndi_config/load.ts";
import { path, YAML } from "src/deps.ts";

describe("cndi ow secrets", () => {
  it("should successfully convert secrets if correctly defined", async () => {
    const cwd = await Deno.makeTempDir();

    // Setup
    await runCndi({
      args: ["init", "-t", "basic", "-l", "aws/eks"],
      cwd,
    });

    // Test
    const { before, after } = await listFilepathsBeforeAndAfter(async () => {
      const [errorLoadingConfig, result] = await loadCNDIConfig(cwd);

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
        path.join(cwd, "cndi_config.yaml"),
        YAML.stringify(config),
      );
      await runCndi({ args: ["ow"], cwd });
    }, cwd);

    const beforeSet = new Set(before);
    const afterSet = new Set(after);

    const added = afterSet.difference(beforeSet);
    const _removed = beforeSet.difference(afterSet);
    const expectedToAdd = new Set([
      path.join(cwd, "cndi", "cluster_manifests", "new-secret.yaml"),
      // new-secret-yet-to-be-defined will update .env with a placeholder, but not yield a secret
    ]);
    assert(setsAreEquivalent(added, expectedToAdd));
    const dotenv = await Deno.readTextFile(path.join(cwd, ".env"));
    assert(dotenv.includes("BAR_SECRET"));
  });

  it("should fail if secrets use plaintext in their definition", async () => {
    const cwd = await Deno.makeTempDir();

    // Setup
    await runCndi({ args: ["init", "-t", "basic", "-l", "aws/eks"], cwd });

    // Test
    const { before, after } = await listFilepathsBeforeAndAfter(async () => {
      const [errorLoadingConfig, result] = await loadCNDIConfig(cwd);

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
        `${cwd}/cndi_config.yaml`,
        YAML.stringify(config),
      );
      await runCndi({ args: ["ow"], cwd });
    }, cwd);
    assert(setsAreEquivalent(new Set(before), new Set(after)));
  });
});
