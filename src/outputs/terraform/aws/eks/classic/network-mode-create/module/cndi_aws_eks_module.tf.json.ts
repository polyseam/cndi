import { getPrettyJSONString } from "src/utils.ts";
import { DEFAULT_K8S_VERSION } from "versions";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

const MODULE_SOURCE =
  "git::https://github.com/terraform-aws-modules/terraform-aws-eks.git?ref=a713f6f464eb579a39918f60f130a5fbb77a6b30";

type AWSAutoModeNodePool = "system" | "general-purpose" | string;

type AWSAutoModeComputeConfig = {
  enabled: boolean;
  node_pools: AWSAutoModeNodePool[];
  node_role_arn: string;
};

type CNDIAWSEKSModule = {
  cluster_addons?: Record<
    string,
    { mostRecent: boolean; serviceAccountRoleArn: string }
  >;
  cluster_name: "${local.cndi_project_name}";
  cluster_version: string;
  cluster_endpoint_public_access: boolean;
  enable_cluster_creator_admin_permissions: boolean;
  vpc_id: string;
  subnet_ids: string;
  source: string;
  cluster_compute_config?: AWSAutoModeComputeConfig; // if defined enroll in automode
};

export default function (cndi_config: NormalizedCNDIConfig) {
  const autoMode = cndi_config?.infrastructure?.cndi?.nodes === "auto";

  const cndi_aws_eks_module: CNDIAWSEKSModule = {
    cluster_name: "${local.cndi_project_name}",
    cluster_version: DEFAULT_K8S_VERSION,
    cluster_endpoint_public_access: true, // TODO: probably bad
    enable_cluster_creator_admin_permissions: true,
    vpc_id: "${module.cndi_aws_vpc_module.vpc_id}",
    subnet_ids: "${module.cndi_aws_vpc_module.private_subnets}",
    source: MODULE_SOURCE,
  };

  if (autoMode) {
    cndi_aws_eks_module["cluster_compute_config"] = {
      enabled: true,
      node_pools: ["general-purpose", "system"],
      node_role_arn: "${aws_iam_role.cndi_aws_iam_role.arn}", // extrapolated from non-auto
    };
  } else {
    cndi_aws_eks_module["cluster_addons"] = {
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
    };
  }

  return getPrettyJSONString({
    module: {
      cndi_aws_eks_module,
    },
  });
}
