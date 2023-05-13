import { getPrettyJSONString } from "src/utils.ts";

interface GetAWSLocalsTFJSONArgs {
  aws_region: string;
}

export default function getAWSLocalsTFJSON(
  { aws_region }: GetAWSLocalsTFJSONArgs,
): string {
  return getPrettyJSONString({
    locals: {
      aws_region,
      cluster_ca_certificate:
        "${base64decode(aws_eks_cluster.cndi_aws_eks_cluster.certificate_authority.0.data)}",
      cluster_endpoint: "${aws_eks_cluster.cndi_aws_eks_cluster.endpoint}",
      cluster_id:
        "${basename(aws_eks_cluster.cndi_aws_eks_cluster.identity[0].oidc[0].issuer)}",
      cluster_name: "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
      cluster_user_arn: "${aws_eks_cluster.cndi_aws_eks_cluster.arn}",
      token: "${data.aws_eks_cluster_auth.cndi_aws_eks_cluster_auth.token}",
    },
  });
}
