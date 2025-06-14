import { getPrettyJSONString } from "src/utils.ts";
import { DEFAULT_K8S_VERSION } from "versions";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-eks.git?ref=a713f6f464eb579a39918f60f130a5fbb77a6b30";

export default function (_cndi_config: NormalizedCNDIConfig) {
  return getPrettyJSONString({
    module: {
      cndi_aws_eks_module: {
        cluster_addons: {
          "aws-ebs-csi-driver": {
            mostRecent: true,
            serviceAccountRoleArn:
              "${module.cndi_aws_iam_assumable_role_ebs_with_oidc.iam_role_arn}",
          },
          "aws-efs-csi-driver": {
            mostRecent: true,
            serviceAccountRoleArn:
              "${module.cndi_aws_iam_assumable_role_efs_with_oidc.iam_role_arn}",
          },
        },
        cluster_name: "${local.cndi_project_name}",
        cluster_version: DEFAULT_K8S_VERSION,
        cluster_endpoint_public_access: true, // TODO: probably bad
        enable_cluster_creator_admin_permissions: true,
        vpc_id: "${module.cndi_aws_vpc_module.vpc_id}",
        subnet_ids: "${module.cndi_aws_vpc_module.private_subnets}",
        source: MODULE_SOURCE,
      },
    },
  });
}
