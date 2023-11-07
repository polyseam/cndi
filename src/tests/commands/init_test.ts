import { assert /*beforeEach, describe, it*/ } from "test-deps";

import { path } from "deps";

import { runCndi } from "src/tests/helpers/run-cndi.ts";

import {
  ensureResourceNamesMatchFileNames,
  hasSameFilesAfter,
} from "src/tests/helpers/util.ts";

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test(
  "'cndi init -d' should set CNDI_TELEMETRY=debug in .env",
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
        "airflow",
        "-d",
        "--set",
        "deployment_target_provider=aws",
      );
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      console.log("dotenv", dotenv);
      assert(dotenv.indexOf(`CNDI_TELEMETRY=debug`) > -1);
      assert(status.success);
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init' without any flags or config files present should fail",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init", "-d", "--loud");

          assert(!status.success);
        }),
      );
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init' should create a readme that begins with the 'project_name' from the current directory",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const project_name = Deno.cwd().split(path.SEP).pop();
      const { status } = await runCndi(
        "init",
        "-t",
        "basic",
        "--set",
        "deployment_target_provider=azure",
      );

      const readme = Deno.readTextFileSync(`README.md`);
      console.log("readme", readme);
      assert(status.success);
      assert(readme.startsWith(`# ${project_name}`));
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init' should create a readme that begins with the 'project_name' if specified in --set",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      const project_name = "foobar-proj";
      const { status } = await runCndi(
        "init",
        "-t",
        "basic",
        "--set",
        `project_name=${project_name}`,
        "--set",
        "deployment_target_provider=azure",
      );

      const readme = Deno.readTextFileSync(`README.md`);
      assert(status.success);
      assert(readme.startsWith(`# ${project_name}`));
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init -t foo' should throw an error because 'foo' is not a valid template",
  async (t) => {
    let dir = "";
    await t.step("setup", async () => {
      dir = await Deno.makeTempDir();
      Deno.chdir(dir);
    });

    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init -t foo"); // cndi init -t foo
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "'cndi init -t https://example.com/does-not-exist.yaml' should throw an error because there is no template found there",
  async (t) => {
    const dir = Deno.makeTempDirSync();
    Deno.chdir(dir);
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi(
            "init",
            "-t",
            "https://example.com/does-not-exist.yaml",
          );
          assert(!status.success);
        }),
      );
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init -t airflow --set deployment_target_provider=aws' should generate a .env file with AWS credentials",
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
        "airflow",
        "--set",
        "deployment_target_provider=aws",
      );
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`AWS_REGION`) > -1);
      assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
      assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
      assert(status.success);
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init -t airflow -dt aws/microk8s' should successfully bootstrap an ec2/microk8s cluster",
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
        "airflow",
        "-l",
        "aws/microk8s",
      );
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`AWS_REGION`) > -1);
      assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
      assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
      assert(status.success);
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

Deno.test(
  "'cndi init -t neo4j --set deployment_target_provider=gcp' should generate a .env file with GCP credentials",
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
        "neo4j",
        "--set",
        "deployment_target_provider=gcp",
      );
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`GCP_REGION`) > -1);
      assert(dotenv.indexOf(`GOOGLE_CREDENTIALS`) > -1);
      assert(status.success);
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
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
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);

// THIS WILL NO LONGER BE NECESSARY WHEN WE IMPLEMENT CDKTF
Deno.test(
  "'cndi init -t airflow --set deployment_target_distribution=aks --set deployment_target_provider=azure' should generate terraform files such that the filenames and resource names are the same",
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
        "airflow",
        "--set",
        "deployment_target_distribution=aks",
        "--set",
        "deployment_target_provider=azure",
      );
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
    await t.step("cleanup", async () => {
      Deno.chdir("..");
      await Deno.remove(dir, { recursive: true });
    });
  },
);
