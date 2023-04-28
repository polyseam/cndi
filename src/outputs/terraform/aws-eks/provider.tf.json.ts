import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSComputeEngineProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: [
      {
        kubectl: {
          apply_retry_count: 5,
          cluster_ca_certificate:
            "${base64decode(data.aws_eks_cluster.cndi_aws_eks_cluster.certificate_authority[0].data)}",
          host: "${aws_eks_cluster.cndi_aws_eks_cluster.endpoint}",
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
      { aws: { region: "${local.aws_region}" } },
      {
        helm: {
          kubernetes: {
            cluster_ca_certificate:
              "${base64decode(data.aws_eks_cluster.cndi_aws_eks_cluster.certificate_authority.0.data)}",
            host: "${data.aws_eks_cluster.cndi_aws_eks_cluster.endpoint}",
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
