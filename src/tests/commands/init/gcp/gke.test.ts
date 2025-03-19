import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";
import { runCndi } from "src/tests/helpers/run-cndi.ts";
import { path } from "deps";

describe("GCP GKE initialization", () => {
  it("should succeed with basic template", async () => {
    const cwd = await Deno.makeTempDir();

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

  it("should generate a .env file with GCP credentials for neo4j template", async () => {
    const cwd = await Deno.makeTempDir();

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
});
