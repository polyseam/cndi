import { YAML } from "deps";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
  with?: Record<string, string | number | boolean>;
  env?: Record<string, string>;
  if?: string;
  id?: string;
};

type WorkflowJob = {
  permissions: string;
  "runs-on": string;
  env: Record<string, string>;
  steps: Array<WorkflowStep>;
};

const getWorkflowJob = (
  _config: NormalizedCNDIConfig,
): WorkflowJob => {
  const steps: Array<WorkflowStep> = [
    {
      name: "Checkout repository",
      uses: "actions/checkout@v4",
      with: {
        "fetch-depth": 0,
      },
    },
    {
      name: "Log in to the Container registry",
      uses: "docker/login-action@65b78e6e13532edd9afa3aa52ac7964289d1a9c1",
      with: {
        registry: "${{ env.REGISTRY }}",
        username: "${{ github.actor }}",
        password: "${{ secrets.GIT_TOKEN }}",
      },
    },
    {
      name: "Extract metadata (tags, labels) for Docker",
      id: "meta",
      uses: "docker/metadata-action@9ec57ed1fcdbf14dcef7dfbe97b2010124a938b7",
      with: {
        images: "${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}",
      },
    },
    {
      name: "Build and push Docker image",
      uses: "docker/build-push-action@f2a1d5e99d037542a71f64918e516c093c6f3fc4",
      with: {
        context: "./cndi/functions",
        push: true,
        tags: "${{ steps.meta.outputs.tags }}",
        labels: "${{ steps.meta.outputs.labels }}",
      },
    },
  ];

  return {
    permissions: "write-all",
    "runs-on": "ubuntu-latest",
    env: {
      GIT_REPO: "${{ secrets.GIT_REPO }}",
      GIT_USERNAME: "${{ secrets.GIT_USERNAME }}",
      GIT_TOKEN: "${{ secrets.GIT_TOKEN }}",
      GIT_SSH_PRIVATE_KEY: "${{ secrets.GIT_SSH_PRIVATE_KEY }}",
      CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
      REGISTRY: "ghcr.io",
      IMAGE_NAME: "${{ github.repository }}-functions",
    },
    steps,
  };
};

const getWorkflowYaml = (
  config: NormalizedCNDIConfig,
  disable = false,
) => {
  const on = disable ? {} : {
    push: {
      branches: ["main", "releases/**"],
    },
  };

  const cndiWorkflowObj = {
    name: "cndi-fns",
    on,
    jobs: {
      "cndi-fns": getWorkflowJob(config),
    },
  };

  return YAML.stringify(cndiWorkflowObj);
};

export default getWorkflowYaml;
