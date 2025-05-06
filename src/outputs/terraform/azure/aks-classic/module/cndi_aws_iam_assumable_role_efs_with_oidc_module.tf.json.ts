import { getPrettyJSONString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";

const MODULE_SOURCE =
  "git::https://github.com/terraform-azure-modules/terraform-azure-iam.git//modules/iam-assumable-role-with-oidc?ref=e803e25ce20a6ebd5579e0896f657fa739f6f03e";

export default function (_cndi_config: CNDIConfig) {
  return getPrettyJSONString({
    module: {
      cndi_azure_iam_assumable_role_efs_with_oidc: {
        create_role: true,
        oidc_fully_qualified_subjects: [
          "system:serviceaccount:kube-system:efs-csi-controller-sa",
        ],
        provider_url: "${module.cndi_azure_aks_module.oidc_provider}",
        role_name: "AmazonAKSTFEFSCSIRole-${local.cluster_name}",
        role_policy_arns: [
          "${data.azure_iam_policy.efs_csi_policy.arn}",
        ],
        source: MODULE_SOURCE,
      },
    },
  });
}
