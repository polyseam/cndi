import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSComputeEngineProviderTFJSON(): string {
  return getPrettyJSONString({
    provider: [
      {
        kubectl: {
          apply_retry_count: 5,
          cluster_ca_certificate:
            "${base64decode(data.aws_eks_cluster.cndi_data_aws_eks_cluster.certificate_authority[0].data)}",
          config_path: "~/.kube/config",
          host: "${aws_eks_cluster.cndi_aws_eks_cluster.endpoint}",
          load_config_file: true,
          token:
            "${data.aws_eks_cluster_auth.cndi_data_aws_eks_cluster_auth.token}",
        },
      },
      { aws: { region: "${local.aws_region}" } },
      {
        helm: {
          kubernetes: {
            cluster_ca_certificate:
              "${base64decode(data.aws_eks_cluster.cndi_data_aws_eks_cluster.certificate_authority.0.data)}",
            config_path: "~/.kube/config",
            host: "${data.aws_eks_cluster.cndi_data_aws_eks_cluster.endpoint}",
            token:
              "${data.aws_eks_cluster_auth.cndi_data_aws_eks_cluster_auth.token}",
          },
        },
      },
      { time: {} },
      { bcrypt: {} },
    ],
  });
}
