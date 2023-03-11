import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { assert } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.173.0/testing/bdd.ts";

import { basicAWSCndiConfig } from "../mocks/cndiConfigs.ts";

import { getPrettyJSONString } from "src/utils.ts";

import { runCndi } from "../helpers/run-cndi.ts";
import {
  ensureResoureNamesMatchFileNames,
  hasSameFilesAfter,
} from "../helpers/util.ts";

beforeEach(() => {
  // initialize sandbox
  const dir = Deno.makeTempDirSync();
  Deno.chdir(dir);
});

describe("cndi init", () => {
  it(`should add correct files and directories when it succeeds`, async () => {
    const initFileList = new Set([
      "cndi-config.jsonc",
      "README.md",
      ".github",
      ".gitignore",
      ".env",
      ".vscode",
      "cndi",
    ]);

    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString(basicAWSCndiConfig),
    );
    // cndi init should fail because there is no config file
    const { status } = await runCndi("init");

    // read the current directory entries after "cndi init" has ran
    for await (const afterDirEntry of Deno.readDir(".")) {
      initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
    }
    assert(initFileList.size === 0); // if the set is empty, all files were created
    assert(status.success);
  });

  it("should fail if ./cndi-config.jsonc is missing without -i", async () => {
    assert(
      await hasSameFilesAfter(async () => {
        const { status } = await runCndi("init");
        assert(!status.success);
      }),
    );
  });

  it(`should create a README beginning with the "project_name" if a config file is supplied`, async () => {
    const project_name = "my-foo-project";
    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString({ ...basicAWSCndiConfig, project_name }),
    );
    const { status } = await runCndi("init");
    assert(status.success);
    const readme = Deno.readTextFileSync(path.join(Deno.cwd(), `README.md`));
    assert(readme.startsWith(`# ${project_name}`));
  });

  describe("config validation", () => {
    it(`should fail if a config file is supplied without a "project_name"`, async () => {
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString({ ...basicAWSCndiConfig, project_name: undefined }),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });

    it(`should fail if a config file is supplied with no nodes`, async () => {
      const nodelessCndiConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { nodes: [] } },
      };
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString(nodelessCndiConfig),
      );
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });

    it(`should fail if a config file is supplied with multiple node kinds`, async () => {
      const nodes = [
        { kind: "gcp", name: "cndi" },
        { kind: "aws", name: "foo" },
      ];

      const multikindNodesConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { nodes } },
      };

      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString(multikindNodesConfig),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });

    it(`should fail if a config file is supplied with no node of role leader`, async () => {
      const nodes = [
        { kind: "gcp", name: "cndi" },
        { kind: "gcp", name: "foo" },
      ];

      const noLeaderConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { nodes } },
      };

      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString(noLeaderConfig),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });

    it(`should fail if a config file is supplied with multiple leaders`, async () => {
      const nodes = [
        { kind: "gcp", name: "cndi", role: "leader" },
        { kind: "gcp", name: "foo", role: "leader" },
      ];

      const multipleLeaderConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { nodes } },
      };

      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString(multipleLeaderConfig),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });

    it(`should fail if a config file is supplied with multiple nodes of the same name`, async () => {
      const nodes = [
        { kind: "gcp", name: "foo", role: "leader" },
        { kind: "gcp", name: "foo" },
      ];

      const duplicateNodeNameConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { nodes } },
      };

      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString(duplicateNodeNameConfig),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });
  });

  describe("templates", () => {
    it(`should throw an error if the template is unavailable`, async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init -t foo"); // cndi init -t foo
          assert(!status.success);
        }),
      );
    });

    it("should add an template specific readme section", async () => {
      const { status } = await runCndi("init", "-t", "aws/airflow-tls");
      const readme = Deno.readTextFileSync(
        path.join(Deno.cwd(), `README.md`),
      );
      assert(readme.indexOf(`## airflow-tls`) > -1);
      assert(status.success);
    });

    describe("aws", () => {
      it("should add an aws specific readme section", async () => {
        const { status } = await runCndi("init", "-t", "aws/airflow-tls");
        const readme = Deno.readTextFileSync(
          path.join(Deno.cwd(), `README.md`),
        );
        assert(readme.indexOf(`## aws`) > -1);
        assert(status.success);
      });

      it("should add a .env file containing AWS env var keys", async () => {
        const { status } = await runCndi("init", "-t", "aws/airflow-tls");
        const dotenv = Deno.readTextFileSync(
          path.join(Deno.cwd(), `.env`),
        );
        assert(dotenv.indexOf(`# AWS`) > -1);
        assert(dotenv.indexOf(`AWS_REGION`) > -1);
        assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
        assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
        assert(status.success);
      });

      it(`should create a set of terraform files where the resource name is the filename for aws`, async () => {
        const { status } = await runCndi("init", "-t", "aws/airflow-tls");
        assert(status.success);
        await ensureResoureNamesMatchFileNames();
      });
    });

    describe("gcp", () => {
      it("should add an gcp specific readme section", async () => {
        const { status } = await runCndi("init", "-t", "gcp/airflow-tls");
        const readme = Deno.readTextFileSync(
          path.join(Deno.cwd(), `README.md`),
        );
        assert(readme.indexOf(`## gcp`) > -1);
        assert(status.success);
      });

      it("should add a .env file containing GCP env var keys", async () => {
        const { status } = await runCndi("init", "-t", "gcp/airflow-tls");
        const dotenv = Deno.readTextFileSync(
          path.join(Deno.cwd(), `.env`),
        );
        assert(dotenv.indexOf(`# GCP`) > -1);
        assert(dotenv.indexOf(`GCP_REGION`) > -1);
        assert(dotenv.indexOf(`GOOGLE_CREDENTIALS`) > -1);
        assert(status.success);
      });
      it(`should create a set of terraform files where the resource name is the filename for gcp`, async () => {
        const { status } = await runCndi("init", "-t", "gcp/airflow-tls");
        assert(status.success);
        await ensureResoureNamesMatchFileNames();
      });
    });

    describe("azure", () => {
      it("should add an azure specific readme section", async () => {
        const { status } = await runCndi("init", "-t", "azure/airflow-tls");
        const readme = Deno.readTextFileSync(
          path.join(Deno.cwd(), `README.md`),
        );
        assert(readme.indexOf(`## azure`) > -1);
        assert(status.success);
      });

      it("should add a .env file containing Azure env var keys", async () => {
        const { status } = await runCndi("init", "-t", "azure/airflow-tls");
        const dotenv = Deno.readTextFileSync(
          path.join(Deno.cwd(), `.env`),
        );
        assert(dotenv.indexOf(`# Azure Resource Manager`) > -1);
        assert(dotenv.indexOf(`ARM_REGION`) > -1);
        assert(dotenv.indexOf(`ARM_CLIENT_SECRET`) > -1);
        assert(dotenv.indexOf(`ARM_CLIENT_ID`) > -1);
        assert(dotenv.indexOf(`ARM_TENANT_ID`) > -1);
        assert(dotenv.indexOf(`ARM_SUBSCRIPTION_ID`) > -1);
        assert(status.success);
      });
      it(`should create a set of terraform files where the resource name is the filename for azure`, async () => {
        const { status } = await runCndi("init", "-t", "azure/airflow-tls");
        assert(status.success);
        await ensureResoureNamesMatchFileNames();
      });
    });
  });
});
