import getProjectRoot from "get-project-root";
import { useTemplate } from "../mod.ts";
import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

describe("Template Loading", () => {
  // This might be duplicate of the file URL test
  it("should load the alpha template from the filesystem with a valid path", async () => {
    const [_, template] = await useTemplate(
      `${getProjectRoot()}/src/tests/mocks/templates/alpha.yaml`,
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!!template);
  });

  it("should fail to load the alpha template from the filesystem with an invalid path", async () => {
    const [_, template] = await useTemplate(
      `${getProjectRoot()}/src/tests/mocks/templates/non-existent.yaml`,
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!template);
  });

  it("should load alpha template using a file URL", async () => {
    const [_, template] = await useTemplate(
      `file://${getProjectRoot()}/src/tests/mocks/templates/alpha.yaml`,
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!!template);
  });

  it("should load the airflow template from the web with a valid URL", async () => {
    const [_, template] = await useTemplate(
      "https://raw.githubusercontent.com/polyseam/cndi/main/templates/airflow.yaml",
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!!template);
  });

  it("should fail to load the airflow template from the web with an invalid URL", async () => {
    const [_, template] = await useTemplate(
      "https://raw.githubusercontent.com/polyseam/cndi/main/xyz.yaml",
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!template);
  });

  it("should load the airflow template from the polyseam directory with a bare name", async () => {
    const [_, template] = await useTemplate("airflow", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
  });

  it("should fail to load a template with a bare name that isn't in the polyseam registry", async () => {
    const [_, template] = await useTemplate("unknown", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });

    assert(!template);
  });

  it("should fail to load a template if it is not YAML", async () => {
    const [_, template] = await useTemplate(
      "https://raw.githubusercontent.com/polyseam/cndi/main/README.md",
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!template);
  });
});
