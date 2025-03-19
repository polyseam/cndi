import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { path } from "deps";

// Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -t basic -l gcp/gke should succeed",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      const { status } = await runCndi({
        args: [
          "init",
          "-t",
          "basic",
          "-l",
          "gcp/gke",
          "--set",
          "dns_provider=google",
          "--set",
          `google_credentials={"type": "service_account", "project_id": "example-project", "universe_domain": "googleapis.com",  "client_email": "my-sa@myproject.iam.gserviceaccount.com"}`,
        ],
        cwd,
      });
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t neo4j --set deployment_target_provider=gcp' should generate a .env file with GCP credentials",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      const run = await runCndi({
        args: [
          "init",
          "-t",
          "neo4j",
          "--set",
          "dns_provider=google",
          "--set",
          "deployment_target_provider=gcp",
          "--set",
          `google_credentials={"type": "service_account", "project_id": "example-project", "universe_domain": "googleapis.com",  "client_email": "my-sa@myproject.iam.gserviceaccount.com"}`,
        ],
        cwd,
      });
      const dotenv = await Deno.readTextFile(path.join(cwd, `.env`));
      assert(dotenv.indexOf(`GCP_REGION`) > -1);
      assert(dotenv.indexOf(`GOOGLE_CREDENTIALS`) > -1);
      assert(run.status.success);
    });
  },
);
