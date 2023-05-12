import { assert, beforeEach, describe, it, path } from "deps";

import { literalizeTemplateValuesInString } from "src/templates/useTemplate.ts";

import { basicAWSCndiConfig } from "src/tests/mocks/cndiConfigs.ts";
import gcpKeyFile from "src/tests/mocks/example-gcp-key.ts";

import { getPrettyJSONString } from "src/utils.ts";

import { getRunningCNDIProcess, runCndi } from "src/tests/helpers/run-cndi.ts";

import processInteractiveEntries from "src/tests/helpers/processInteractiveEntries.ts";

import {
  ensureResoureNamesMatchFileNames,
  hasSameFilesAfter,
} from "src/tests/helpers/util.ts";

// Key codes
const _keys = {
  up: "\x1B\x5B\x41",
  down: "\x1B\x5B\x42",
  enter: "\x0D",
  space: "\x20",
};

Deno.env.set("CNDI_TELEMETRY", "debug");

beforeEach(() => {
  // initialize sandbox
  const dir = Deno.makeTempDirSync();
  Deno.chdir(dir);
});

describe("cndi", () => {
  it("should have a working test suite", () => {
    assert(true);
  });

  describe("cndi init", () => {
    it("should fail if ./cndi-config.jsonc is missing without -i", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });

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
  });

  describe("config validation", () => {
    it(`should fail if a config file is supplied without a "project_name"`, async () => {
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString({
          ...basicAWSCndiConfig,
          project_name: undefined,
        }),
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

    it(`should throw an error if a named template does not exist`, async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init -t aws/foo"); // cndi init -t aws/foo
          assert(!status.success);
        }),
      );
    });

    it(`should throw an error if a template url 404s`, async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi(
            "init",
            "-t",
            "https://example.com/does-not-exist.jsonc",
          );
          assert(!status.success);
        }),
      );
    });

    it(`should successfully execute remote templates`, async () => {
      const initFileList = new Set([
        "cndi-config.jsonc",
        "README.md",
        ".github",
        ".gitignore",
        ".env",
        ".vscode",
        "cndi",
      ]);

      // cndi init should fail because there is no config file
      const { status } = await runCndi(
        "init",
        "-t",
        "https://raw.githubusercontent.com/polyseam/example-cndi-templates/main/azure/airflow-tls.jsonc",
      );

      // read the current directory entries after "cndi init" has ran
      for await (const afterDirEntry of Deno.readDir(".")) {
        initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
      }

      assert(initFileList.size === 0); // if the set is empty, all files were created
      assert(status.success);
    });

    it("should add an template specific readme section", async () => {
      const { status } = await runCndi("init", "-t", "aws/airflow-tls");
      const readme = Deno.readTextFileSync(
        path.join(Deno.cwd(), `README.md`),
      );
      assert(readme.indexOf(`## airflow-tls`) > -1);
      assert(status.success);
    });

    it("should replace all instances of a prompt slot with the appropriate value", () => {
      const promptResponses = {
        exampleA: "foo",
        exampleB: "bar",
        whiteSpaceIgnored: "true",
      };

      const cndiConfigStr = `{
        "cluster_manifests": {
          "myExampleA": "{{ $.cndi.prompts.responses.exampleA }}",
          "myExampleB": "{{ $.cndi.prompts.responses.exampleB }}",
          "whitespaceIgnored": {{      $.cndi.prompts.responses.whiteSpaceIgnored              }},
          "title": "my-{{ $.cndi.prompts.responses.exampleA }}-{{ $.cndi.prompts.responses.exampleB }}-cluster"
        }
      }`;

      const literalized = literalizeTemplateValuesInString(
        promptResponses,
        cndiConfigStr,
      );
      assert(literalized.indexOf(`"myExampleA": "foo"`) > -1);
      assert(literalized.indexOf(`"myExampleB": "bar"`) > -1);
      assert(literalized.indexOf(`"title": "my-foo-bar-cluster"`) > -1);
      assert(literalized.indexOf(`"whitespaceIgnored": true,`) > -1);
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
  describe("cndi init --interactive", () => {
    it(
      "-i -t aws/basic should create all cndi project files and directories",
      async () => {
        const p = getRunningCNDIProcess("init", "-i", "-t", "aws/basic");

        const status = await processInteractiveEntries(
          p,
          {
            project_name: "acme-project",
            GIT_USERNAME: "acmefella",
            GIT_PASSWORD: "ghp_1234567890",
            GIT_REPO: "https://github.com/acmeorg/acme-project",
            AWS_REGION: "us-east-1",
            AWS_ACCESS_KEY_ID: "AKIA1234567890",
            AWS_SECRET_ACCESS_KEY: "1234567890",
            argocdDomainName: "argocd.acme.org",
            letsEncryptClusterIssuerEmailAddress: "acmefella@acme.org",
          },
        );

        const initFileList = new Set([
          "cndi-config.jsonc",
          "README.md",
          ".github",
          ".gitignore",
          ".env",
          ".vscode",
          "cndi",
        ]);

        // read the current directory entries after "cndi init" has ran
        for (const afterDirEntry of Deno.readDirSync(".")) {
          initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
        }

        assert(status.success);
        assert(initFileList.size === 0); // if the set is empty, all files were created
      },
    );

    it(
      "-i -t gcp/basic should create all cndi project files and directories",
      async () => {
        const p = getRunningCNDIProcess("init", "-i", "-t", "gcp/basic");

        const tmpFile = Deno.makeTempFileSync();

        Deno.writeTextFileSync(
          tmpFile,
          getPrettyJSONString(gcpKeyFile),
        );

        const status = await processInteractiveEntries(
          p,
          {
            project_name: "acme-project-gcp",
            GIT_USERNAME: "acmefella",
            GIT_PASSWORD: "ghp_1234567890",
            GIT_REPO: "https://github.com/acmeorg/acme-project",
            GCP_REGION: "",
            GOOGLE_CREDENTIALS: tmpFile,
            argocdDomainName: "argocd.acme.org",
            letsEncryptClusterIssuerEmailAddress: "acmefella@acme.org",
          },
        );

        const initFileList = new Set([
          "cndi-config.jsonc",
          "README.md",
          ".github",
          ".gitignore",
          ".env",
          ".vscode",
          "cndi",
        ]);

        // read the current directory entries after "cndi init" has ran
        for (const afterDirEntry of Deno.readDirSync(".")) {
          initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
        }

        assert(status.success);
        assert(initFileList.size === 0); // if the set is empty, all files were created
      },
    );

    it(
      "-i -t azure/basic should create all cndi project files and directories",
      async () => {
        const p = getRunningCNDIProcess("init", "-i", "-t", "azure/basic");

        const status = await processInteractiveEntries(
          p,
          {
            project_name: "acme-project-azure",
            GIT_USERNAME: "acmefella",
            GIT_PASSWORD: "ghp_1234567890",
            GIT_REPO: "https://github.com/acmeorg/acme-project",
            ARM_REGION: "eastus",
            ARM_CLIENT_ID: "1234567890",
            ARM_CLIENT_SECRET: "1234567890",
            ARM_TENANT_ID: "1234567890",
            ARM_SUBSCRIPTION_ID: "1234567890",
            argocdDomainName: "argocd.acme.org",
            letsEncryptClusterIssuerEmailAddress: "acmefella@acme.org",
          },
        );

        const initFileList = new Set([
          "cndi-config.jsonc",
          "README.md",
          ".github",
          ".gitignore",
          ".env",
          ".vscode",
          "cndi",
        ]);

        // read the current directory entries after "cndi init" has ran
        for (const afterDirEntry of Deno.readDirSync(".")) {
          initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
        }

        assert(status.success);
        assert(initFileList.size === 0); // if the set is empty, all files were created
      },
    );
  });
});
