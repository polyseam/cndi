import { assert } from "test-deps";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -d' should set CNDI_TELEMETRY=debug in .env",
  async (t) => {
    const cwd = Deno.makeTempDirSync();

    // TODO: This is unvalidated, CNDI_TELEMETRY was set above
    await t.step("setup", () => {
      Deno.env.delete("CNDI_TELEMETRY");
    });

    await t.step("test", async () => {
      /* const { status } = */ await runCndi({
        args: [
          "init",
          "-t",
          "airflow",
          "-d",
          "--set",
          "deployment_target_provider=aws",
        ],
        cwd,
      });
      const dotenv = await Deno.readTextFile(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`CNDI_TELEMETRY=debug`) > -1);
      // assert(status.success);
    });

    await t.step("cleanup", () => {
      Deno.env.set("CNDI_TELEMETRY", "debug");
    });
  },
);

Deno.test(
  "'cndi init -t airflow --set deployment_target_provider=aws' should generate a .env file with AWS credentials",
  async (t) => {
    const cwd = Deno.makeTempDirSync();

    await t.step("test", async () => {
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
      const dotenv = await Deno.readTextFile(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`AWS_REGION`) > -1);
      assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
      assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
    });
  },
);
