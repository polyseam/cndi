import { useTemplate } from "../mod.ts";
import { assert } from "test-deps";
import getProjectRoot from "get-project-root";

const mySanity = { sanitizeResources: false, sanitizeOps: false };
Deno.test(
  "template validation: basic template should pass validation",
  mySanity,
  async () => {
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
  },
);
// This throws error from fetch() cause it is looking for file:// and is grtting "C" as protocol
Deno.test(
  "template validation: more provided values should pass validation",
  mySanity,
  async () => {
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
  },
);
