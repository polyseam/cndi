import getProjectRoot from "get-project-root";
import { useTemplate } from "../mod.ts";
import { assert } from "test-deps";
import { describe, it } from "@std/testing/bdd";

const mySanity = { sanitizeResources: false, sanitizeOps: false };

describe("Template Loading", mySanity, () => {
  // This might be duplicate of the file URL test
  it("alpha template should be loadable by filepath", async () => {
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

  it("alpha template should fail with bad filepath", async () => {
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

  it("alpha template should be loadable by file URL", async () => {
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

  it("airflow template should be loadable by remote HTTP URL", async () => {
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

  it("airflow template should fail with a bad remote HTTP URL", async () => {
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

  it("airflow template should be loadable by bare name", async () => {
    const [_, template] = await useTemplate("airflow", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
  });

  it("bare name specifier for unknown template should fail", async () => {
    const [_, template] = await useTemplate("unknown", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });

    assert(!template);
  });

  it("non-yaml file should fail", async () => {
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
