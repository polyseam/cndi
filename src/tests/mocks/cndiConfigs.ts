const basicAWSCndiConfig = {
  cndi_version: "v1",
  project_name: "my-cndi-project-a",
  distribution: "microk8s",
  provider: "aws",
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          instance_type: "m5a.2xlarge",
          volume_size: 128,
        },
        {
          name: "y-node",
          volume_size: 128,
        },
      ],
    },
  },
  cluster_manifests: {},
  applications: {},
};

const basicGCPCndiConfig = {
  cndi_version: "v1",
  project_name: "my-cndi-project-b",
  distribution: "microk8s",
  provider: "gcp",
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          machine_type: "n2-standard-2",
          volume_size: 128,
        },
        {
          name: "y-node",
          volume_size: 128,
        },
      ],
    },
  },
  cluster_manifests: {},
  applications: {},
};

const basicAzureCndiConfig = {
  cndi_version: "v1",
  project_name: "my-cndi-project-c",
  distribution: "microk8s",
  provider: "azure",
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          machine_type: "n2-standard-2",
          volume_size: 128,
        },
        {
          name: "y-node",
          volume_size: 128,
        },
      ],
    },
  },
  cluster_manifests: {},
  applications: {},
};
const basicDevCndiConfig = {
  cndi_version: "v1",
  project_name: "my-cndi-project-d",
  distribution: "microk8s",
  provider: "dev",
  infrastructure: {
    cndi: {
      nodes: [
        {
          "name": "dev-node",
          "volume_size": 128,
        },
      ],
    },
  },
  cluster_manifests: {},
  applications: {},
};

const emptyCndiConfig = {};

export {
  basicAWSCndiConfig,
  basicAzureCndiConfig,
  basicDevCndiConfig,
  basicGCPCndiConfig,
  emptyCndiConfig,
};
