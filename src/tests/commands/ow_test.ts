import { assert } from "test-deps";

import { path, YAML } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import { hasSameFilesAfter } from "src/tests/helpers/util.ts";
import {copyDir} from "src/utils.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
    "'cndi init -d' should set CNDI_TELEMETRY=debug in .env",
    async (t) => {
      let dir = "";
      await t.step("setup", async () => {
        dir = await Deno.makeTempDir();
        Deno.chdir(dir);
        await copyDir(path.join(Deno.cwd(), "tests","mocks","projects","eks-basic"), dir)
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
        const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
        assert(dotenv.indexOf(`CNDI_TELEMETRY=debug`) > -1);
        // assert(status.success);
      });
      await t.step("cleanup", async () => {
        Deno.chdir("..");
        await Deno.remove(dir, { recursive: true });
      });
    },
  );