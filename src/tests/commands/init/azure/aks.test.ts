import { assert, describe, it } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { path } from "deps";

describe("Azure AKS initialization", () => {
  it("should succeed with basic template", async () => {
    const cwd = await Deno.makeTempDir();

    const { status } = await runCndi({
      args: ["init", "-t", "basic", "-l", "azure/aks"],
      cwd,
    });
    assert(status.success);
  });

  it("should generate a .env file with Azure credentials for basic template", async () => {
    const cwd = await Deno.makeTempDir();

    const { status } = await runCndi({
      args: [
        "init",
        "-t",
        "basic",
        "--set",
        "deployment_target_provider=azure",
      ],
      cwd,
    });

    const dotenv = await Deno.readTextFile(path.join(cwd, `.env`));
    // assert(dotenv.indexOf(`# Azure Resource Manager`) > -1);
    assert(dotenv.indexOf(`ARM_REGION`) > -1);
    assert(dotenv.indexOf(`ARM_CLIENT_SECRET`) > -1);
    assert(dotenv.indexOf(`ARM_CLIENT_ID`) > -1);
    assert(dotenv.indexOf(`ARM_TENANT_ID`) > -1);
    assert(dotenv.indexOf(`ARM_SUBSCRIPTION_ID`) > -1);
    assert(status.success);
  });
});
