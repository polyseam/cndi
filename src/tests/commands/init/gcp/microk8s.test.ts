import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -t basic -l gcp/microk8s should succeed",
  async (t) => {
    const cwd = await Deno.makeTempDir();

    await t.step("test", async () => {
      const { status } = await runCndi({
        args: [
          "init",
          "-t",
          "basic",
          "-l",
          "gcp/microk8s",
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
