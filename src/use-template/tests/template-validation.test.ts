import { useTemplate } from "../mod.ts";
import { assert } from "test-deps";
import getProjectRoot from "get-project-root";
import { describe, it } from "@std/testing/bdd";

// Use Deno.env.set to configure test options if needed
// This would replace the mySanity object in the BDD style

const mySanity = { sanitizeResources: false, sanitizeOps: false };

describe("Template Validation", mySanity, () => {
  it("basic template should pass validation", async () => {
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

  // This throws error from fetch() cause it is looking for file:// and is getting "C" as protocol
  it("more provided values should pass validation", async () => {
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
