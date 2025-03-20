import { assert, describe, it } from "test-deps";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("cndi init environment variables", () => {
  it("generates a .env file with AWS credentials for airflow template", async () => {
    const cwd = await Deno.makeTempDir();

    /* const { status } = */ await runCndi({
      args: [
        "init",
        "-t",
        "airflow",
        "--set",
        "deployment_target_provider=aws",
      ],
      cwd,
    });
    const dotenv = await Deno.readTextFile(path.join(cwd, `.env`));
    assert(dotenv.indexOf(`AWS_REGION`) > -1);
    assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
    assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
  });
});
