import { assert, describe, it } from "test-deps";
import { runCndi } from "src/tests/helpers/run-cndi.ts";

describe("GCP MicroK8s initialization", () => {
  it("should succeed with basic template", async () => {
    const cwd = await Deno.makeTempDir();

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
        `google_credentials='{"type": "service_account", "project_id": "example-project", "universe_domain": "googleapis.com",  "client_email": "my-sa@myproject.iam.gserviceaccount.com"}'`,
      ],
      cwd,
    });
    assert(status.success);
  });
});
