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
        "${module.cndi_aws_eks_cluster.certificate_authority_data}",
      cluster_endpoint: "${module.cndi_aws_eks_cluster.cluster_endpoint}",
      cluster_id:
        "${basename(module.cndi_aws_eks_cluster.cluster_oidc_issuer_url)}",
      cluster_name: "${module.cndi_aws_eks_cluster.cluster_name}",
      cluster_user_arn: "${module.cndi_aws_eks_cluster.cluster_arn}",
      token: "${data.aws_eks_cluster_auth.cndi_aws_eks_cluster_auth.token}",
    },
  });
}
