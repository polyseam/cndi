import { assert } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

import getProjectRoot from "get-project-root";

const ogDir = getProjectRoot();

const cleanup = () => {
  Deno.chdir(ogDir);
};

Deno.test(
  "'cndi init -t basic -l gcp/microk8s should succeed",
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
        "gcp/microk8s",
        "--set",
        "dns_provider=google",
        "--set",
        `google_credentials={"type": "service_account", "project_id": "example-project", "universe_domain": "googleapis.com",  "client_email": "my-sa@myproject.iam.gserviceaccount.com"}`,
      );
      assert(status.success);
    });

    await t.step("cleanup", cleanup);
  },
);
