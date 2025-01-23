import { assert } from "test-deps";

import { path, YAML } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -t airflow -l aws/microk8s -k' should generate a cndi_responses.yaml which parses successfully",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      await runCndi({
        args: [
          "init",
          "-t",
          "airflow",
          "-l",
          "aws/microk8s",
          "-k",
        ],
        cwd,
      });

      const cndi_responses = await Deno.readTextFile(
        path.join(Deno.cwd(), `cndi_responses.yaml`),
      );
      assert(YAML.parse(cndi_responses));
    });
  },
);
