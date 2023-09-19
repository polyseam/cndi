import { assert /*beforeEach, describe, it*/ } from "test-deps";

import { path, YAML } from "deps";

// import { literalizeTemplateValuesInString } from "src/templates/useTemplate.ts";

import { basicAWSCndiConfig } from "src/tests/mocks/cndiConfigs.ts";
import gcpKeyFile from "src/tests/mocks/example-gcp-key.ts";

import { getPrettyJSONString } from "src/utils.ts";

import {
  getRunningCNDIProcess,
  runCndi,
  //   runCndiLoud,
} from "src/tests/helpers/run-cndi.ts";

import processInteractiveEntries from "src/tests/helpers/processInteractiveEntries.ts";

import {
  ensureResourceNamesMatchFileNames,
  // getModuleDir,
  hasSameFilesAfter,
} from "src/tests/helpers/util.ts";

import getProjectRootDir from "get-project-root";

Deno.env.set("CNDI_TELEMETRY", "debug");

// get a clean empty sandbox for each test
function prepareSandbox() {
  const dir = Deno.makeTempDirSync();
  Deno.chdir(dir);
}

const setup = {
  fn: prepareSandbox,
  name: "setup",
};

Deno.test("'cndi init' with cndi-config.yaml", async (t) => {
  await t.step(setup);
  await t.step("test", async () => {
    const initFileList = new Set([
      "cndi-config.yaml",
      "README.md",
      ".github",
      ".gitignore",
      ".env",
      ".vscode",
      "cndi",
    ]);

    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.yaml`),
      YAML.stringify(basicAWSCndiConfig),
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
});

Deno.test("'cndi init' with cndi-config.jsonc", async (t) => {
  await t.step(setup);
  await t.step("test", async () => {
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
});

Deno.test(
  "'cndi init -d' should set CNDI_TELEMETRY=debug in .env",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "aws/airflow", "-d");
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`CNDI_TELEMETRY=debug`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init' without any flags or config files present should fail",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "'cndi init' should create a readme that begins with the 'project_name'",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const project_name = "my-foo-project";
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.yaml`),
        YAML.stringify({ ...basicAWSCndiConfig, project_name }),
      );
      const { status } = await runCndi("init");
      assert(status.success);
      const readme = Deno.readTextFileSync(path.join(Deno.cwd(), `README.md`));
      assert(readme.startsWith(`# ${project_name}`));
    });
  },
);

Deno.test(
  "'cndi init' should fail if no cndi-config file or flags are present",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "cndi-config validation: should fail if there are multiple nodes where kind=='dev'",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString({
          project_name: "dev_project",
          infrastructure: {
            cndi: {
              nodes: [{ kind: "dev" }, { kind: "dev" }],
            },
          },
        }),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "cndi-config validation: should fail if there is no 'project_name'",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
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
  },
);

Deno.test(
  "cndi-config validation: should fail if there are no cndi nodes",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
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
  },
);

Deno.test(
  "cndi-config validation: should fail if there are multiple different node kinds",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
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
  },
);

Deno.test(
  "cndi-config validation: should fail if there is no cndi node where role=='leader'",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
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
  },
);

Deno.test(
  "cndi-config validation: should fail if there are more than one cndi node where role=='leader'",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const nodes = [
        { kind: "gcp", name: "cndi", role: "leader" },
        { kind: "gcp", name: "foo", role: "leader" },
      ];

      const multipleLeaderConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { nodes } },
      };

      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.yaml`),
        YAML.stringify(multipleLeaderConfig),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "cndi-config validation: should fail if there are multiple cndi nodes with the same 'name'",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
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
  },
);

Deno.test(
  "cndi-config validation: should fail if open_ports are not correctly specified",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const stringOpenPortsConfig = {
        ...basicAWSCndiConfig,
        infrastructure: { cndi: { open_ports: "foo" } },
      };

      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString(stringOpenPortsConfig),
      );

      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "cndi-config: should allow 'open_ports' for infrastructure only (no manifests)",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.jsonc`),
        getPrettyJSONString({
          ...basicAWSCndiConfig,
          infrastructure: {
            cndi: {
              ...basicAWSCndiConfig.infrastructure.cndi,
              open_ports: [
                {
                  name: "ssh",
                  number: 22,
                },
              ],
            },
          },
        }),
      );
      assert(
        !(await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(status.success);
        })),
      );
    });
  },
);

Deno.test(
  "cndi-config: 'open_ports' should work properly when fully specified",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      Deno.writeTextFileSync(
        path.join(Deno.cwd(), `cndi-config.yaml`),
        YAML.stringify({
          ...basicAWSCndiConfig,
          infrastructure: {
            cndi: {
              ...basicAWSCndiConfig.infrastructure.cndi,
              open_ports: [
                {
                  name: "neo4j",
                  number: 7687,
                  service: "neo4j",
                  namespace: "neo4j",
                },
                {
                  name: "postgres",
                  number: 5432,
                },
              ],
            },
          },
        }),
      );
      assert(
        !(await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init");
          assert(status.success);
        })),
      );
    });
  },
);

Deno.test(
  "'cndi init -t foo' should throw an error because 'foo' is not a valid template",
  async (t) => {
    await t.step(setup);
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
  "'cndi init -t ec2/foo' should throw an error because 'ec2/foo' is not a valid template",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      assert(
        await hasSameFilesAfter(async () => {
          const { status } = await runCndi("init -t ec2/foo"); // cndi init -t foo
          assert(!status.success);
        }),
      );
    });
  },
);

Deno.test(
  "'cndi init -t https://example.com/does-not-exist.jsonc' should throw an error because there is no template found there",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
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
  },
);

Deno.test(
  "'cndi init -t $VALID_JSONC_TEMPLATE_URL' should generate a project successfully",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const initFileList = new Set([
        "cndi-config.yaml",
        "README.md",
        ".github",
        ".gitignore",
        ".env",
        ".vscode",
        "cndi",
      ]);

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
  },
);

Deno.test(
  "'cndi init -t $VALID_YAML_TEMPLATE_URL' should generate a project successfully",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const initFileList = new Set([
        "cndi-config.yaml",
        "README.md",
        ".github",
        ".gitignore",
        ".env",
        ".vscode",
        "cndi",
      ]);

      const { status } = await runCndi(
        "init",
        "-t",
        "https://raw.githubusercontent.com/polyseam/cndi/yaml/src/templates/yaml/azure/airflow.yaml",
      );

      // read the current directory entries after "cndi init" has ran
      for await (const afterDirEntry of Deno.readDir(".")) {
        initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
      }

      assert(initFileList.size === 0); // if the set is empty, all files were created
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t file://path/to/valid/template.yaml' should generate a project successfully",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const initFileList = new Set([
        "cndi-config.yaml",
        "README.md",
        ".github",
        ".gitignore",
        ".env",
        ".vscode",
        "cndi",
      ]);

      const pathToProjectRoot = getProjectRootDir();
      const absPathToTemplate = path.join(
        pathToProjectRoot,
        "src",
        "templates",
        "ec2",
        "airflow.yaml",
      );

      // cndi init should fail because there is no config file
      const { status } = await runCndi(
        "init",
        "-t",
        `file://${absPathToTemplate}`,
      );

      // read the current directory entries after "cndi init" has ran
      for await (const afterDirEntry of Deno.readDir(".")) {
        initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
      }

      assert(initFileList.size === 0); // if the set is empty, all files were created
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t ec2/airflow' should generate a README.md that references Airflow and ec2",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "ec2/airflow");
      const readme = Deno.readTextFileSync(path.join(Deno.cwd(), `README.md`));
      assert(readme.indexOf(`## airflow`) > -1);
      assert(readme.indexOf(`## aws ec2`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t ec2/airflow' should generate a .env file with AWS credentials",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "ec2/airflow");
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`# AWS`) > -1);
      assert(dotenv.indexOf(`AWS_REGION`) > -1);
      assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
      assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t eks/neo4j' should generate terraform files such that the filenames and resource names are the same",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "eks/neo4j");
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
  },
);

Deno.test(
  "'cndi init -t eks/airflow' should generate a .env file with AWS credentials",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "eks/airflow");
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`# AWS`) > -1);
      assert(dotenv.indexOf(`AWS_REGION`) > -1);
      assert(dotenv.indexOf(`AWS_SECRET_ACCESS_KEY`) > -1);
      assert(dotenv.indexOf(`AWS_ACCESS_KEY_ID`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t ec2/airflow' should generate terraform files such that the filenames and resource names are the same",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "ec2/airflow");
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
  },
);

Deno.test(
  "'cndi init -t gcp/neo4j' should generate a README.md that references Neo4j and GCP",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "gcp/neo4j");
      const readme = Deno.readTextFileSync(path.join(Deno.cwd(), `README.md`));
      assert(readme.indexOf(`## neo4j`) > -1);
      assert(readme.indexOf(`## gcp`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t gcp/neo4j' should generate a .env file with GCP credentials",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "gcp/neo4j");
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`# GCP`) > -1);
      assert(dotenv.indexOf(`GCP_REGION`) > -1);
      assert(dotenv.indexOf(`GOOGLE_CREDENTIALS`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t gce/neo4j' should generate terraform files such that the filenames and resource names are the same",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "gce/neo4j");
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
  },
);

Deno.test(
  "'cndi init -t gke/neo4j' should generate terraform files such that the filenames and resource names are the same",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "gke/neo4j");
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
  },
);

Deno.test(
  "'cndi init -t azure/mongodb' should generate a README.md that references MongoDB and Azure",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "azure/mongodb");
      const readme = Deno.readTextFileSync(path.join(Deno.cwd(), `README.md`));
      assert(readme.indexOf(`## mongodb`) > -1);
      assert(readme.indexOf(`## azure`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t avm/airflow' should generate a .env file with Azure credentials",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "avm/airflow");
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`# Azure Resource Manager`) > -1);
      assert(dotenv.indexOf(`ARM_REGION`) > -1);
      assert(dotenv.indexOf(`ARM_CLIENT_SECRET`) > -1);
      assert(dotenv.indexOf(`ARM_CLIENT_ID`) > -1);
      assert(dotenv.indexOf(`ARM_TENANT_ID`) > -1);
      assert(dotenv.indexOf(`ARM_SUBSCRIPTION_ID`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t aks/airflow' should generate a .env file with Azure credentials",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "aks/airflow");
      const dotenv = Deno.readTextFileSync(path.join(Deno.cwd(), `.env`));
      assert(dotenv.indexOf(`# Azure Resource Manager`) > -1);
      assert(dotenv.indexOf(`ARM_REGION`) > -1);
      assert(dotenv.indexOf(`ARM_CLIENT_SECRET`) > -1);
      assert(dotenv.indexOf(`ARM_CLIENT_ID`) > -1);
      assert(dotenv.indexOf(`ARM_TENANT_ID`) > -1);
      assert(dotenv.indexOf(`ARM_SUBSCRIPTION_ID`) > -1);
      assert(status.success);
    });
  },
);

Deno.test(
  "'cndi init -t avm/mongodb' should generate terraform files such that the filenames and resource names are the same",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "avm/mongodb");
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
  },
);

Deno.test(
  "'cndi init -t aks/airflow' should generate terraform files such that the filenames and resource names are the same",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const { status } = await runCndi("init", "-t", "aks/airflow");
      assert(status.success);
      await ensureResourceNamesMatchFileNames();
    });
  },
);

Deno.test(
  "'cndi init -i -t azure/basic' should generate a project given interactive input",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const p = getRunningCNDIProcess("init", "-i", "-t", "azure/basic");

      // this object is ordered!!
      const status = await processInteractiveEntries(p, {
        project_name: "acme-project-azure",
        useSSH: "n",
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
      });

      const initFileList = new Set([
        "cndi-config.yaml",
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
    });
  },
);

Deno.test(
  "'cndi init -i -t ec2/basic' should generate a project given interactive input",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const p = getRunningCNDIProcess("init", "-i", "-t", "ec2/basic");

      // this object is ordered!!
      const status = await processInteractiveEntries(p, {
        project_name: "acme-ec2-project",
        useSSH: "n",
        GIT_USERNAME: "acmefella",
        GIT_PASSWORD: "ghp_1234567890",
        GIT_REPO: "https://github.com/acmeorg/acme-project",
        AWS_REGION: "us-east-1",
        AWS_ACCESS_KEY_ID: "AKIA1234567890",
        AWS_SECRET_ACCESS_KEY: "1234567890",
        argocdDomainName: "argocd.acme.org",
        letsEncryptClusterIssuerEmailAddress: "acmefella@acme.org",
      });

      const initFileList = new Set([
        "cndi-config.yaml",
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
    });
  },
);

Deno.test(
  "'cndi init -i -t eks/basic' should generate a project given interactive input",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const p = getRunningCNDIProcess("init", "-i", "-t", "eks/basic");
      // this object is ordered!!
      const status = await processInteractiveEntries(p, {
        project_name: "acme-eks-project",
        useSSH: "n",
        GIT_USERNAME: "acmefella",
        GIT_PASSWORD: "ghp_1234567890",
        GIT_REPO: "https://github.com/acmeorg/acme-project",
        AWS_REGION: "us-east-1",
        AWS_ACCESS_KEY_ID: "AKIA1234567890",
        AWS_SECRET_ACCESS_KEY: "1234567890",
        argocdDomainName: "argocd.acme.org",
        letsEncryptClusterIssuerEmailAddress: "acmefella@acme.org",
      });

      const initFileList = new Set([
        "cndi-config.yaml",
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
    });
  },
);

Deno.test(
  "'cndi init -i -t gcp/basic' should generate a project given interactive input",
  async (t) => {
    await t.step(setup);
    await t.step("test", async () => {
      const p = getRunningCNDIProcess("init", "-i", "-t", "gcp/basic");

      const tmpFile = Deno.makeTempFileSync();

      Deno.writeTextFileSync(tmpFile, getPrettyJSONString(gcpKeyFile));
      // this object is ordered!!
      const status = await processInteractiveEntries(p, {
        project_name: "acme-project-gcp",
        useSSH: "n",
        GIT_USERNAME: "acmefella",
        GIT_PASSWORD: "ghp_1234567890",
        GIT_REPO: "https://github.com/acmeorg/acme-project",
        GCP_REGION: "",
        GOOGLE_CREDENTIALS: tmpFile,
        argocdDomainName: "argocd.acme.org",
        letsEncryptClusterIssuerEmailAddress: "acmefella@acme.org",
      });

      const initFileList = new Set([
        "cndi-config.yaml",
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
    });
  },
);
