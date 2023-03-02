const basicCndiConfig = {
  cndi_version: "v1",
  project_name: "my-cndi-project",
  infrastructure: {
    cndi: {
      nodes: [
        {
          name: "x-node",
          kind: "aws",
          role: "leader",
          instance_type: "m5a.2xlarge",
          volume_size: 128,
        },
      ],
    },
  },
  cluster_manifests: {},
  applications: {},
};

const emptyCndiConfig = {};

export { basicCndiConfig, emptyCndiConfig };
