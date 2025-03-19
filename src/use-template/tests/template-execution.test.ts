import { path, YAML } from "deps";
import { useTemplate, UseTemplateResult } from "../mod.ts";
import { assert, parseDotEnv } from "test-deps";
import { CNDIConfig } from "src/types.ts";
import getProjectRoot from "get-project-root";
import { describe, it } from "@std/testing/bdd";
describe("Template Execution", () => {
  it("should reference 'airflow' in README.md when using airflow template", async () => {
    const templateResult = await useTemplate("airflow", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    assert(template.files["README.md"].includes("airflow"));
  });

  it("should not reference 'airflow' in README.md when using basic template", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    assert(!template.files["README.md"].includes("airflow"));
  });

  it("should process $cndi.comment calls in cndi_config.yaml", async () => {
    const [_, template] = await useTemplate(
      `${getProjectRoot()}/src/use-template/tests/mock/templates/comment-mock.yaml`,
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    const configStr = template?.files["cndi_config.yaml"];
    assert(!!configStr);
    assert(!configStr.includes("$cndi.comment"));
    assert(configStr.includes("# This is a comment"));
  });

  it("should include aws credentials in .env when using basic template with aws provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    const env = parseDotEnv(template.files[".env"]);
    assert(typeof env.AWS_ACCESS_KEY_ID === "string");
    assert(typeof env.AWS_SECRET_ACCESS_KEY === "string");
  });

  it("should include GOOGLE_CREDENTIALS in .env when using basic template with gcp provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "gcp",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    const env = parseDotEnv(template.files[".env"]);
    assert(env.GOOGLE_CREDENTIALS);
  });

  it("should include azure credentials in .env when using basic template with azure provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    const env = parseDotEnv(template.files[".env"]);
    assert(env.ARM_CLIENT_ID);
    assert(env.ARM_CLIENT_SECRET);
    assert(env.ARM_SUBSCRIPTION_ID);
    assert(env.ARM_TENANT_ID);
  });

  it("should reference 'azure' in README.md when using basic template with azure provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    assert(template.files["README.md"].includes("azure"));
  });

  it("should reference 'gcp' in README.md when using basic template with gcp provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "gcp",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    assert(template.files["README.md"].includes("gcp"));
  });

  it("should reference 'aws' in README.md when using basic template with aws provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    assert(template.files["README.md"].includes("aws"));
  });

  it("should have aws provider in cndi_config.yaml when using basic template with aws provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;
    assert(parsed.provider === "aws");
  });

  it("should have gcp provider in cndi_config.yaml when using basic template with gcp provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "gcp",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;
    assert(parsed.provider === "gcp");
  });

  it("should have azure provider in cndi_config.yaml when using basic template with azure provider", async () => {
    // () is the root of the project
    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    assert(!!template);
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;
    assert(parsed.provider === "azure");
  });

  it("should not include external_dns in cndi_config.yaml when disabled in basic template", async () => {
    // () is the root of the project

    const templateResult = await useTemplate("basic", {
      interactive: false,
      overrides: {
        deployment_target_provider: "azure",
        enable_external_dns: false,
      },
    });
    const template = templateResult[1] as UseTemplateResult;
    // deno-lint-ignore no-explicit-any
    const parsed = YAML.parse(template.files["cndi_config.yaml"]) as any;

    assert(!parsed.infrastructure?.cndi?.external_dns);
    assert(!parsed.infrastructure?.cndi?.external_dns?.enabled);
    assert(JSON.stringify(parsed.infrastructure?.cndi?.external_dns) !== "{}");
  });

  it("should insert blocks using $cndi.get_block", async () => {
    const fns_hostname = "fns.example.com";
    const mockYamlFileUri = "file://" +
      getProjectRoot() +
      "/src/use-template/tests/mock/templates/get_block-mock.yaml";
    const templateResult = await useTemplate(mockYamlFileUri, {
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
    const template = templateResult[1] as UseTemplateResult;
    const config = YAML.parse(template.files["cndi_config.yaml"]) as CNDIConfig;
    assert(config?.infrastructure?.cndi?.functions?.hostname === fns_hostname);
    assert(config?.cluster_manifests?.kind === "Namespace");
  });

  it("should add extra files to the output", async () => {
    const mockYamlFileUri = "file://" +
      getProjectRoot() +
      "/src/use-template/tests/mock/templates/extra_files-mock.yaml";
    const templateResult = await useTemplate(mockYamlFileUri, {
      interactive: false,
      overrides: {
        project_name: "test",
        greet_who: "Extra!",
      },
    });
    const text = "Hello World!";
    const template = templateResult[1] as UseTemplateResult;
    assert(template.files[path.join("my", "extra_file.txt")] === text);
  });

  it("should fail validation for extra_files not beginning with './'", async () => {
    const mockYamlFileUri = "file://" +
      getProjectRoot() +
      "/src/use-template/tests/mock/templates/extra_files_invalid-mock.yaml";

    const templateResult = await useTemplate(mockYamlFileUri, {
      interactive: false,
      overrides: {
        project_name: "test",
        greet_who: "Extra!",
      },
    });
    const err = templateResult[0];
    assert(err);
  });

  it("should not clobber siblings when using $cndi.get_block", async () => {
    const mockYamlFileUri = "file://" +
      getProjectRoot() +
      "/src/use-template/tests/mock/templates/get_block_with_peer-mock.yaml";
    const [errUsingTemplate, template] = await useTemplate(mockYamlFileUri, {
      interactive: false,
      overrides: {
        project_name: "test",
        greet_who: "Extra!",
        enable_alpha: true,
      },
    });

    if (errUsingTemplate) {
      throw errUsingTemplate;
    }

    const config = YAML.parse(template.files["cndi_config.yaml"]) as CNDIConfig;

    const values = config?.applications?.myapp?.values as {
      some_beta_content: { should_exist: boolean };
      some_charlie_content: { should_exist: boolean };
      details: { example_a: string };
    };

    assert(values.some_beta_content?.should_exist);
    assert(values?.some_charlie_content?.should_exist);
    assert(values?.details.example_a === "value_a");
  });
});
