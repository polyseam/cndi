import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSComputeEngineProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: [
      {
        kubectl: {
          apply_retry_count: 5,
          cluster_ca_certificate:
            "${module.cndi_aws_eks_cluster.cluster_certificate_authority_data}",
          host: "${module.cndi_aws_eks_cluster.cluster_endpoint}",
          exec: {
            api_version: "client.authentication.k8s.io/v1beta1",
            args: [
              "eks",
              "get-token",
              "--cluster-name",
              "${local.cluster_name}",
            ],
            command: "aws",
          },
        },
      },
      {
        aws: {
          region: "${local.aws_region}",
          default_tags: {
            tags: {
              CNDIProject: "${local.cndi_project_name}",
              CNDIVersion: "v1",
            },
          },
        },
      },
      {
        helm: {
          kubernetes: {
            cluster_ca_certificate:
              "${module.cndi_aws_eks_cluster.cluster_certificate_authority_data}",
            host: "${module.cndi_aws_eks_cluster.cluster_endpoint}",
            exec: {
              api_version: "client.authentication.k8s.io/v1beta1",
              args: [
                "eks",
                "get-token",
                "--cluster-name",
                "${local.cluster_name}",
              ],
              command: "aws",
            },
          },
        },
      },
      { time: {} },
      { bcrypt: {} },
    ],
  });
}
