import { YAML } from "deps";
import { useTemplate } from "../mod.ts";
import { assert, assertRejects, parseDotEnv } from "test-deps";
import { CNDIConfig } from "src/types.ts";

const mySanity = { sanitizeResources: false, sanitizeOps: false };

Deno.test(
  "template execution: 'airflow' template should reference 'airflow' in 'README.md'",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("airflow", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
    assert(template.files["README.md"].includes("airflow"));
  },
);

Deno.test(
  "template execution: 'basic' template should not reference 'airflow' in 'README.md'",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
    assert(!template.files["README.md"].includes("airflow"));
  },
);

Deno.test(
  "template execution: 'basic' .env with target provider aws should reference aws credentials",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
    const env = parseDotEnv(template.files[".env"]);
    assert(typeof env.AWS_ACCESS_KEY_ID === "string");
    assert(typeof env.AWS_SECRET_ACCESS_KEY === "string");
  },
);

Deno.test(
  "template execution: 'basic' .env with target provider gcp should reference GOOGLE_CREDENTIALS",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "gcp",
      },
    });
    assert(!!template);
    const env = parseDotEnv(template.files[".env"]);
    assert(env.GOOGLE_CREDENTIALS);
  },
);

Deno.test(
  "template execution: 'basic' .env with target provider azure should reference azure credentials",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
      },
    });
    assert(!!template);
    const env = parseDotEnv(template.files[".env"]);
    assert(env.ARM_CLIENT_ID);
    assert(env.ARM_CLIENT_SECRET);
    assert(env.ARM_SUBSCRIPTION_ID);
    assert(env.ARM_TENANT_ID);
  },
);

Deno.test(
  "template execution: 'basic' README.md with target provider 'azure' should reference azure",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
      },
    });
    assert(!!template);
    assert(template.files["README.md"].includes("azure"));
  },
);

Deno.test(
  "template execution: 'basic' README.md with target provider 'gcp' should reference gcp",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "gcp",
      },
    });
    assert(!!template);
    assert(template.files["README.md"].includes("gcp"));
  },
);

Deno.test(
  "template execution: 'basic' README.md with target provider 'aws' should reference aws",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
    assert(template.files["README.md"].includes("aws"));
  },
);

Deno.test(
  "template execution: 'basic' aws template should have aws provider in cndi_config.yaml",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;
    assert(parsed.provider === "aws");
  },
);

Deno.test(
  "template execution: 'basic' gcp template should have gcp provider in cndi_config.yaml",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "gcp",
      },
    });
    assert(!!template);
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;
    assert(parsed.provider === "gcp");
  },
);

Deno.test(
  "template execution: 'basic' azure template should have azure provider in cndi_config.yaml",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
      },
    });
    assert(!!template);
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;
    assert(parsed.provider === "azure");
  },
);

Deno.test(
  "template execution: when external_dns is disabled the 'basic' template should not have external_dns in cndi_config.yaml",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project

    const template = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
        enable_external_dns: false,
      },
    });

    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;

    assert(!parsed.infrastructure?.cndi?.external_dns);
    assert(!parsed.infrastructure?.cndi?.external_dns?.enabled);
    assert(JSON.stringify(parsed.infrastructure?.cndi?.external_dns) !== "{}");
  },
);

Deno.test(
  "template execution: a template should be able to insert a block using $cndi.get_block(block_name)",
  mySanity,
  async () => {
    const fns_hostname = "fns.example.com";
    const mockYamlFileUri = "file://" + Deno.cwd() +
      "/src/use-template/tests/mock/templates/get_block-mock.yaml";
    const template = await useTemplate(mockYamlFileUri, {
      interactive: false,
      overrides: {
        project_name: "test",
        enable_fns_ingress: true,
        fns_hostname,
        deployment_target_provider: "aws",
        deployment_target_distribution: "eks",
        cert_manager_email: "matt.johnston@polyseam.io",
      },
    });
    const config = YAML.parse(template.files["cndi_config.yaml"]) as CNDIConfig;
    assert(config?.infrastructure?.cndi?.functions?.hostname === fns_hostname);
  },
);

Deno.test(
  "template execution: a template should be able to add extra files to the output",
  mySanity,
  async () => {
    const mockYamlFileUri = "file://" + Deno.cwd() +
      "/src/use-template/tests/mock/templates/extra_files-mock.yaml";
    const template = await useTemplate(mockYamlFileUri, {
      interactive: false,
      overrides: {
        project_name: "test",
        greet_who: "Extra!",
      },
    });
    const text = "Hello World!";
    assert(template.files["my/extra_file.txt"] === text);
  },
);

Deno.test(
  "template execution: a template should fail validation if it has an extra_files block which does not begin with a './'",
  mySanity,
  async () => {
    const mockYamlFileUri = "file://" + Deno.cwd() +
      "/src/use-template/tests/mock/templates/extra_files_invalid-mock.yaml";

    try {
      await assertRejects(
        async () => {
          await useTemplate(mockYamlFileUri, {
            interactive: false,
            overrides: {
              project_name: "test",
              greet_who: "Extra!",
            },
          });
        },
      );
    } catch {
      console.log("validation failed to throw error");
      assert(false);
    }
  },
);
