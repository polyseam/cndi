import { assert } from "test-deps";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

import getProjectRoot from "get-project-root";

const ogDir = getProjectRoot();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init -d' should set CNDI_TELEMETRY=debug in .env",
  async (t) => {
    let dir = "";

    // TODO: This is unvalidated, CNDI_TELEMETRY was set above
    Deno.env.delete("CNDI_TELEMETRY");

    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      /* const { status } = */ await runCndi(
        "init",
        "-t",
        "airflow",
        "-d",
        "--set",
        "deployment_target_provider=aws",
      );
      const dotenv = await Deno.readTextFile(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`CNDI_TELEMETRY=debug`) > -1);
      // assert(status.success);
    });
    await t.step("cleanup", cleanup);
  },
);

Deno.test(
  "'cndi init -t airflow --set deployment_target_provider=aws' should generate a .env file with AWS credentials",
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
        "--set",
        "deployment_target_provider=aws",
      );
      const dotenv = await Deno.readTextFile(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`AWS_REGION`) > -1);
      assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
      assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
      // assert(status.success);
    });
    await t.step("cleanup", cleanup);
  },
);
