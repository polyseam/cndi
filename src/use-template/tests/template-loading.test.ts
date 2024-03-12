import getProjectRoot from "get-project-root";
import { useTemplate } from "../mod.ts";
import { assert, assertRejects } from "test-deps";

const mySanity = { sanitizeResources: false, sanitizeOps: false };

Deno.test(
  "template loading: alpha template should be loadable by filepath",
  mySanity,
  async () => {
    // Deno.cwd() is the root of the project
    const template = await useTemplate(
      `${getProjectRoot()}/src/tests/mocks/templates/alpha.yaml`,
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

Deno.test(
  "template loading: alpha template should fail with bad filepath",
  mySanity,
  () => {
    // Deno.cwd() is the root of the project
    assertRejects(async () => {
      const _template = await useTemplate(
        `${getProjectRoot()}/src/tests/mocks/templates/non-existent.yaml`,
        {
          interactive: false,
          overrides: {
            deployment_target_provider: "aws",
          },
        },
      );
    });
  },
);

Deno.test(
  "template loading: alpha template should be loadable by file URL",
  mySanity,
  async () => {
    const template = await useTemplate(
      `file://${getProjectRoot()}/src/tests/mocks/templates/alpha.yaml`,
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

Deno.test(
  "template loading: airflow template should be loadable by remote HTTP URL",
  mySanity,
  async () => {
    const template = await useTemplate(
      "https://raw.githubusercontent.com/polyseam/cndi/main/templates/airflow.yaml",
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

Deno.test(
  "template loading: airflow template should fail with a bad remote HTTP URL",
  mySanity,
  () => {
    assertRejects(async () => {
      const _result = await useTemplate(
        "https://raw.githubusercontent.com/polyseam/cndi/main/xyz.yaml",
        {
          interactive: false,
          overrides: {
            deployment_target_provider: "aws",
          },
        },
      );
    });
  },
);

Deno.test(
  "template loading: airflow template should be loadable by bare name",
  mySanity,
  async () => {
    const template = await useTemplate("airflow", {
      interactive: false,
      overrides: {
        deployment_target_provider: "aws",
      },
    });
    assert(!!template);
  },
);

Deno.test(
  "template loading: bare name specifier for unknown template should fail",
  mySanity,
  () => {
    assertRejects(async () => {
      const _template = await useTemplate("unknown", {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      });
    });
  },
);

Deno.test("template loading: non-yaml file should fail", mySanity, () => {
  assertRejects(async () => {
    const _template = await useTemplate(
      "https://raw.githubusercontent.com/polyseam/cndi/main/README.md",
      {
        interactive: false,
        overrides: {
          deployment_target_provider: "aws",
        },
      },
    );
  });
});
