import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import {
  listChangedFilePaths,
  setsAreEquivalent,
} from "src/tests/helpers/util.ts";

import { path } from "src/deps.ts";
// Deno.env.set("CNDI_TELEMETRY", "debug");

describe("cndi ow functions", () => {
  it("should bootstrap functions if source typescript is provided", async () => {
    const cwd = await Deno.makeTempDir();
    const filePathsCreatedForFunctions = new Set([
      path.join(cwd, "cndi", "functions", "Dockerfile"),
      path.join(cwd, "cndi", "functions", "src", "hello", "index.ts"),
      path.join(cwd, "cndi", "functions", "src", "main", "index.ts"),
      path.join(cwd, "cndi", "cluster_manifests", "fns-pull-secret.yaml"),
      path.join(cwd, "cndi", "cluster_manifests", "fns-deployment.yaml"),
      path.join(cwd, "cndi", "cluster_manifests", "fns-env-secret.yaml"),
      path.join(cwd, "cndi", "cluster_manifests", "fns-namespace.yaml"),
      path.join(cwd, "cndi", "cluster_manifests", "fns-service.yaml"),
      path.join(cwd, ".github", "workflows", "cndi-fns.yaml"),
      path.join(cwd, "functions", "hello", "index.ts"),
    ]);

    // Setup
    await runCndi({
      args: [
        "init",
        "-t",
        "basic",
        "-l",
        "aws/eks",
        "--set",
        "git_repo=https://github.com/polyseam/example-repo",
      ],
      cwd,
    });

    // Test
    const changedFilePaths = await listChangedFilePaths(async () => {
      await Deno.mkdir(path.join(cwd, `functions`, `hello`), {
        recursive: true,
      });
      await Deno.writeTextFile(
        path.join(cwd, "functions", "hello", "index.ts"),
        `Deno.serve(() => (new Response('', { status: 200 })));`,
        { create: true },
      );
      const { status } = await runCndi({ args: ["ow"], cwd });
      assert(status.success);
    }, cwd);
    const changedFilePathsSet = new Set(changedFilePaths);

    assert(
      setsAreEquivalent(filePathsCreatedForFunctions, changedFilePathsSet),
    );
  });
});
