import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

// describe("cndi init debug flag", () => {
//   it("should set CNDI_TELEMETRY=debug in .env when using -d flag", async () => {
//     const cwd = await Deno.makeTempDir();
//
//     // TODO: This is unvalidated, CNDI_TELEMETRY was set above
//     // Setup
//     Deno.env.delete("CNDI_TELEMETRY");
//
//     // Test
//     /* const { status } = */ await runCndi({
//       args: [
//         "init",
//         "-t",
//         "airflow",
//         "-d",
//         "--set",
//         "deployment_target_provider=aws",
//       ],
//       cwd,
//     });
//     const dotenv = await Deno.readTextFile(path.join(cwd, `.env`));
//     assert(dotenv.indexOf(`CNDI_TELEMETRY=debug`) > -1);
//     // assert(status.success);
//
//     // Cleanup
//     // Deno.env.set("CNDI_TELEMETRY", "debug");
//   });
// });

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
