import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { path } from "deps";

Deno.env.set("CNDI_TELEMETRY", "debug");

const ogDir = Deno.cwd();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init -t basic -l azure/aks should succeed",
  async (t) => {
    let dir = "";

    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const { status } = await runCndi(
        "init",
        "-t",
        "basic",
        "-l",
        "azure/aks",
      );
      assert(status.success);
    });

    await t.step("cleanup", cleanup);
  },
);

Deno.test(
  "'cndi init -t airflow --set deployment_target_provider=azure' should generate a .env file with Azure credentials",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const { status } = await runCndi(
        "init",
        "-t",
        "basic",
        "--set",
        "deployment_target_provider=azure",
      );
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      // assert(dotenv.indexOf(`# Azure Resource Manager`) > -1);
      assert(dotenv.indexOf(`ARM_REGION`) > -1);
      assert(dotenv.indexOf(`ARM_CLIENT_SECRET`) > -1);
      assert(dotenv.indexOf(`ARM_CLIENT_ID`) > -1);
      assert(dotenv.indexOf(`ARM_TENANT_ID`) > -1);
      assert(dotenv.indexOf(`ARM_SUBSCRIPTION_ID`) > -1);
      assert(status.success);
    });
    await t.step("cleanup", cleanup);
  },
);
