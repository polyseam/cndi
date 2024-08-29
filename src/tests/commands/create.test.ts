import { assert, getProjectRoot, loadDotEnv, path } from "test-deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

const { GIT_TOKEN } = loadDotEnv({
  export: true,
  envPath: path.join(getProjectRoot(), ".env"),
});

Deno.env.set("GH_TOKEN", GIT_TOKEN);

const decoder = new TextDecoder("utf-8");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi create' should throw an error if the repo-slug argument contains invalid characters",
  async (t) => {
    let dir = "";

    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const result = await runCndi(
        "create",
        "owner.foo/repo",
        "-l",
        "aws/eks",
        "-t",
        "basic",
      );

      assert(result.status.success === false);
      assert(result.stderrOutput.includes("slug"));
    });

    await t.step("cleanup", cleanup);
  },
);

Deno.test(
  "'cndi create' should create a repo if called correctly",
  async (t) => {
    let dir = "";

    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    const repoName = `test-eks-${dir.split(path.SEPARATOR).pop()}`;

    await t.step("test", async () => {
      const result = await runCndi(
        "create",
        `polyseam/${repoName}`,
        "-l",
        "aws/eks",
        "-t",
        "basic",
        "--non-interactive",
        "--loud",
      );

      assert(result.status.success);
    });

    await t.step("clean-repo", () => {
      const command = new Deno.Command("gh", {
        args: [
          "repo",
          "delete",
          `polyseam/${repoName}`,
          "--yes",
        ],
        stderr: "piped",
        stdout: "piped",
      });

      const { code, stderr, stdout } = command.outputSync();

      if (code !== 0) {
        console.error(decoder.decode(stderr));
      } else {
        console.log(decoder.decode(stdout));
      }
    });

    await t.step("cleanup", cleanup);
  },
);
