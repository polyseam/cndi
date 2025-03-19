import { useTemplate } from "../mod.ts";
import { assert } from "test-deps";
import getProjectRoot from "get-project-root";
import { describe, it } from "test-deps";

describe("Template Validation", () => {
  it("should pass validation when a 'basic' template is given minimum configuration", async () => {
    const template = await useTemplate(
      `${getProjectRoot()}/src/tests/mocks/templates/basic.yaml`,
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
    assert(!!template);
  });

  it("should pass validation when more values are provided as overrides", async () => {
    const [_, template] = await useTemplate(
      `${getProjectRoot()}/src/tests/mocks/templates/basic.yaml`,
      {
        interactive: false,
        overrides: {
          project_name: "my-app",
          deployment_target_provider: "aws",
          deployment_target_distribution: "microk8s",
          argocd_hostname: "argocd.example.com",
        },
      },
    );
    assert(!!template);
  });
});
