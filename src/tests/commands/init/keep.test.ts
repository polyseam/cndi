import { assert } from "test-deps";

import { path, YAML } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

import getProjectRoot from "get-project-root";

const ogDir = getProjectRoot();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init -t airflow -l aws/microk8s -k' should generate a cndi_responses.yaml which parses successfully",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      /* const { status } = */ await runCndi(
        "init",
        "-t",
        "airflow",
        "-l",
        "aws/microk8s",
        "-k",
      );

      const cndi_responses = await Deno.readTextFile(
        path.join(Deno.cwd(), `cndi_responses.yaml`),
      );
      assert(YAML.parse(cndi_responses));
    });
    await t.step("cleanup", cleanup);
  },
);
