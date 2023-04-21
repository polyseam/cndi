const basicAWSCndiConfig = {
  cndi_version: "v1",
  project_name: "my-cndi-project-a",
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          kind: "aws-ec2",
          role: "leader",
          instance_type: "m5a.2xlarge",
          volume_size: 128,
        },
        {
          name: "y-node",
          kind: "aws-ec2",
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
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          kind: "gcp",
          role: "leader",
          machine_type: "n2-standard-2",
          volume_size: 128,
        },
        {
          name: "y-node",
          kind: "gcp",
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
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          kind: "azure",
          role: "leader",
          machine_type: "n2-standard-2",
          volume_size: 128,
        },
        {
          name: "y-node",
          kind: "azure",
          volume_size: 128,
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
  basicGCPCndiConfig,
  emptyCndiConfig,
};
