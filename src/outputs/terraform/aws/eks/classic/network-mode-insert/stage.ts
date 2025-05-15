import { CNDIConfig, CNDINetworkConfigInsert } from "src/types.ts";
import { ccolors, path } from "deps";

import { stageFile } from "src/utils.ts";

import { ErrOut } from "errout";

// Shared Terraform Blocks
import getLocalsTfJSON from "src/outputs/terraform/shared/locals.tf.json.ts";
import getTerraformTfJSON from "src/outputs/terraform/shared/terraform.ts";
import getProviderTfJSON from "src/outputs/terraform/shared/provider.tf.json.ts";
import getVariableTfJSON from "src/outputs/terraform/shared/variable.tf.json.ts";
import getOutputTfJSON from "src/outputs/terraform/shared/output.tf.json.ts";

// Shared Kubernetes Terraform Resources
import cndi_helm_release_argocd from "src/outputs/terraform/shared/resource/cndi_helm_release_argocd.tf.json.ts";
import cndi_helm_release_argocd_apps from "src/outputs/terraform/shared/resource/cndi_helm_release_argocd_apps.tf.json.ts";
import cndi_helm_release_sealed_secrets from "src/outputs/terraform/shared/resource/cndi_helm_release_sealed_secrets.tf.json.ts";
import cndi_kubernetes_secret_sealed_secrets_key from "src/outputs/terraform/shared/resource/cndi_kubernetes_secret_sealed_secrets_key.tf.json.ts";
import cndi_kubernetes_secret_argocd_private_repo from "src/outputs/terraform/shared/resource/cndi_kubernetes_secret_argocd_private_repo.tf.json.ts";
import cndi_time_static_argocd_admin_password from "src/outputs/terraform/shared/resource/cndi_time_static_argocd_admin_password.tf.json.ts";

// Core Terraform Insert Mode Blocks
import getDataTfJSON from "../shared/data.tf.json.ts";

// AWS EKS Classic Terraform Modules
import getCndiAWSEKSModuleTfJSON from "./module/cndi_aws_eks_module.tf.json.ts";
import getCndiAWSIAMAssumableRoleEBSWithOIDCModuleTfJSON from "../shared/module/cndi_aws_iam_assumable_role_ebs_with_oidc_module.tf.json.ts";
import getCndiAWSIAMAssumableRoleEFSWithOIDCModuleTfJSON from "../shared/module/cndi_aws_iam_assumable_role_efs_with_oidc_module.tf.json.ts";

// AWS EKS Classic Terraform Resources
import cndi_aws_efs_access_point from "../shared/resource/cndi_aws_efs_access_point.tf.json.ts";
import cndi_aws_efs_file_system from "../shared/resource/cndi_aws_efs_file_system.tf.json.ts";
import cndi_aws_iam_policy from "../shared/resource/cndi_aws_iam_policy.tf.json.ts";
import cndi_aws_iam_role from "../shared/resource/cndi_aws_iam_role.tf.json.ts";
import cndi_aws_iam_role_policy_attachment from "../shared/resource/cndi_aws_iam_role_policy_attachment.tf.json.ts";
import cndi_aws_launch_template from "../shared/resource/cndi_aws_launch_template.tf.json.ts";
import cndi_aws_resourcegroups_group from "../shared/resource/cndi_aws_resourcegroups_group.tf.json.ts";

// AWS EKS Classic Insert Terraform Resources
import cndi_aws_efs_mount_target from "../shared/resource/cndi_aws_efs_mount_target.tf.json.ts";
import cndi_aws_eks_node_group from "../shared/resource/cndi_aws_eks_node_group.tf.json.ts";

// AWS EKS Classic Terraform Kubernetes Resources
import cndi_kubernetes_storage_class from "../shared/resource/cndi_kubernetes_storage_class.tf.json.ts";

const label = ccolors.faded(
  "src/outputs/terraform/aws/eks/classic/network-mode-insert/stage.ts:\n",
);

export async function stageAWSEKSClassicNetworkModeInsertTerraformFiles(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const networkSpec = cndi_config?.infrastructure?.cndi
    ?.network as CNDINetworkConfigInsert;

  const { vnet_identifier, subnet_identifiers } = networkSpec;

  if (!vnet_identifier) {
    return new ErrOut([
      ccolors.warn("cndi_config.yaml:"),
      ccolors.error("vnet_identifier"),
      ccolors.error(
        "must be defined in",
      ),
      ccolors.key_path("infrastructure.cndi.network"),
      ccolors.error("when running cndi in"),
      ccolors.key_name("'insert'"),
      ccolors.error("network mode"),
    ], {
      label,
      code: -1,
      id: "vnet-identifier-not-defined",
    });
  }

  if (!vnet_identifier.startsWith("vpc-")) {
    return new ErrOut([
      ccolors.warn("cndi_config.yaml:"),
      ccolors.key_path("infrastructure.cndi.network.vnet_identifier"),
      ccolors.error(
        "must start with",
      ),
      ccolors.user_input("vpc-"),
      ccolors.error("when running cndi in"),
      ccolors.key_name("'insert'"),
      ccolors.error("network mode"),
    ], {
      label,
      code: -1,
      id: "vnet-identifier-not-valid",
    });
  }

  if (!Array.isArray(subnet_identifiers) || subnet_identifiers?.length < 2) {
    return new ErrOut([
      ccolors.warn("cndi_config.yaml:"),
      ccolors.key_path("infrastructure.cndi.network.subnet_identifiers"),
      ccolors.error(
        "must be an array of at least",
      ),
      ccolors.user_input("2"),
      ccolors.error("subnet identifiers"),
      ccolors.error("when running cndi in"),
      ccolors.key_name("'insert'"),
      ccolors.error("network mode"),
    ], {
      label,
      code: -1,
      id: "subnet-identifiers-not-defined",
    });
  }

  for (const subnet_id of subnet_identifiers) {
    if (!subnet_id.startsWith("subnet-")) {
      return new ErrOut([
        ccolors.warn("cndi_config.yaml:"),

        ccolors.error("each entry in"),
        ccolors.key_path("infrastructure.cndi.network.subnet_identifiers"),
        ccolors.error(
          "must begin with",
        ),
        ccolors.user_input("subnet-"),
        ccolors.error("when running cndi in"),
        ccolors.key_name("'insert'"),
        ccolors.error("network mode"),
      ], {
        label,
        code: -1,
        id: "subnet-identifiers-not-valid",
      });
    }
  }

  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);

  const data = getDataTfJSON(cndi_config);

  const locals = getLocalsTfJSON(cndi_config, {
    vnet_identifier,
    subnet_identifiers,
  });

  const cndi_aws_eks_module = getCndiAWSEKSModuleTfJSON(cndi_config);
  const cndi_aws_iam_assumable_role_ebs_with_oidc_module =
    getCndiAWSIAMAssumableRoleEBSWithOIDCModuleTfJSON(cndi_config);
  const cndi_aws_iam_assumable_role_efs_with_oidc_module =
    getCndiAWSIAMAssumableRoleEFSWithOIDCModuleTfJSON(cndi_config);

  await Promise.all([
    stageFile(path.join("cndi", "terraform", "data.tf.json"), data),
    stageFile(path.join("cndi", "terraform", "locals.tf.json"), locals),
    stageFile(path.join("cndi", "terraform", "output.tf.json"), output),
    stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider),
    stageFile(path.join("cndi", "terraform", "variable.tf.json"), variable),
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_eks_module.tf.json"),
      cndi_aws_eks_module,
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_aws_iam_assumable_role_ebs_with_oidc_module.tf.json",
      ),
      cndi_aws_iam_assumable_role_ebs_with_oidc_module,
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_aws_iam_assumable_role_efs_with_oidc_module.tf.json",
      ),
      cndi_aws_iam_assumable_role_efs_with_oidc_module,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_efs_access_point.tf.json"),
      cndi_aws_efs_access_point(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_efs_file_system.tf.json"),
      cndi_aws_efs_file_system(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_efs_mount_target.tf.json"),
      cndi_aws_efs_mount_target(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_eks_node_group.tf.json"),
      cndi_aws_eks_node_group(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_iam_policy.tf.json"),
      cndi_aws_iam_policy(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_iam_role.tf.json"),
      cndi_aws_iam_role(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_aws_iam_role_policy_attachment.tf.json",
      ),
      cndi_aws_iam_role_policy_attachment(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_launch_template.tf.json"),
      cndi_aws_launch_template(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_resourcegroups_group.tf.json"),
      cndi_aws_resourcegroups_group(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_kubernetes_storage_class.tf.json"),
      cndi_kubernetes_storage_class(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_helm_release_argocd.tf.json"),
      cndi_helm_release_argocd(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_helm_release_argocd_apps.tf.json"),
      cndi_helm_release_argocd_apps(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_helm_release_sealed_secrets.tf.json",
      ),
      cndi_helm_release_sealed_secrets(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_kubernetes_secret_sealed_secrets_key.tf.json",
      ),
      cndi_kubernetes_secret_sealed_secrets_key(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_kubernetes_secret_argocd_private_repo.tf.json",
      ),
      cndi_kubernetes_secret_argocd_private_repo(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_time_static_argocd_admin_password.tf.json",
      ),
      cndi_time_static_argocd_admin_password(cndi_config),
    ),
  ]);
  return null;
}
