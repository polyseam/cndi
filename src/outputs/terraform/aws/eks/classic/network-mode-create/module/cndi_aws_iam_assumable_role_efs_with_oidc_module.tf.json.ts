import { getPrettyJSONString } from "src/utils.ts";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-iam.git//modules/iam-assumable-role-with-oidc?ref=e803e25ce20a6ebd5579e0896f657fa739f6f03e";

export default function (_cndi_config: NormalizedCNDIConfig) {
  return getPrettyJSONString({
    module: {
      cndi_aws_iam_assumable_role_efs_with_oidc: {
        create_role: true,
        oidc_fully_qualified_subjects: [
          "system:serviceaccount:kube-system:efs-csi-controller-sa",
        ],
        provider_url: "${module.cndi_aws_eks_module.oidc_provider}",
        role_name: "AmazonEKSTFEFSCSIRole-${local.cndi_project_name}",
        role_policy_arns: [
          "${data.aws_iam_policy.efs_csi_policy.arn}",
        ],
        source: MODULE_SOURCE,
      },
    },
  });
}
