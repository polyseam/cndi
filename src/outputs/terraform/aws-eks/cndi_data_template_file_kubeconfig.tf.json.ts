import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getTemplateKubeconfigTFJSON(): string {
  const data = getTFData("template_file", {
    vars: {
      cluster_ca_certificate:
        "${aws_eks_cluster.cndi_aws_eks_cluster.certificate_authority[0].data}",
      cluster_endpoint: "${aws_eks_cluster.cndi_aws_eks_cluster.endpoint}",
      cluster_name: "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
      cluster_user_arn: "${aws_eks_cluster.cndi_aws_eks_cluster.arn}",
      region: "${local.region}",
      token: "${data.aws_eks_cluster_auth.cndi_aws_eks_cluster_auth.token}",
    },
  }, "cndi_data_template_file_kubeconfig");
  return getPrettyJSONString(data);
}
