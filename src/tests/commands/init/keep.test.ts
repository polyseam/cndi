import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

import { path, YAML } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("cndi init keep command", () => {
  it("should generate a cndi_responses.yaml which parses successfully with -t airflow -l aws/microk8s -k", async () => {
    const cwd = await Deno.makeTempDir();

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
      path.join(cwd, `cndi_responses.yaml`),
    );
    assert(YAML.parse(cndi_responses));
  });
});
