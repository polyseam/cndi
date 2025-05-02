import { CNDIConfig, TFBlocks } from "src/types.ts";
import { path } from "deps";
import {
  ARGOCD_APPS_CHART_VERSION,
  ARGOCD_CHART_VERSION,
  // DEFAULT_K8S_VERSION,
  SEALED_SECRETS_CHART_VERSION,
} from "versions";

import {
  getPrettyJSONString,
  // getTaintEffectForDistribution,
  patchAndStageTerraformFilesWithInput,
  stageFile,
  // useSshRepoAuth,
} from "src/utils.ts";

import getDataTfJSON from "./data.tf.json.ts";

import { ErrOut } from "errout";
import getLocalsTfJSON from "src/outputs/terraform/locals.tf.json.ts";
import getTerraformTfJSON from "src/outputs/terraform/terraform.ts";
import getProviderTfJSON from "src/outputs/terraform/provider.tf.json.ts";
import getVariableTfJSON from "src/outputs/terraform/variable.tf.json.ts";
import getOutputTfJSON from "src/outputs/terraform/output.tf.json.ts";

import getCndiAWSEKSModuleTfJSON from "./module/cndi_aws_eks_module.tf.json.ts";
import getCndiAWSVPCModuleTfJSON from "./module/cndi_aws_vpc_module.tf.json.ts";
import getCndiAWSIAMAssumableRoleEBSWithOIDCModuleTfJSON from "./module/cndi_aws_iam_assumable_role_ebs_with_oidc_module.tf.json.ts";
import getCndiAWSIAMAssumableRoleEFSWithOIDCModuleTfJSON from "./module/cndi_aws_iam_assumable_role_efs_with_oidc_module.tf.json.ts";

import cndi_aws_efs_access_point from "./resource/cndi_aws_efs_access_point.tf.json.ts";
import cndi_aws_efs_file_system from "./resource/cndi_aws_efs_file_system.tf.json.ts";
import cndi_aws_efs_mount_target from "./resource/cndi_aws_efs_mount_target.tf.json.ts";
import cndi_aws_eks_node_group from "./resource/cndi_aws_eks_node_group.tf.json.ts";
import cndi_aws_iam_policy from "./resource/cndi_aws_iam_policy.tf.json.ts";
import cndi_aws_iam_role from "./resource/cndi_aws_iam_role.tf.json.ts";
import cndi_aws_iam_role_policy_attachment from "./resource/cndi_aws_iam_role_policy_attachment.tf.json.ts";
import cndi_aws_launch_template from "./resource/cndi_aws_launch_template.tf.json.ts";
import cndi_aws_resourcegroups_group from "./resource/cndi_aws_resourcegroups_group.tf.json.ts";

export async function stageTerraformSynthAWSEKS(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const data = getDataTfJSON(cndi_config);
  const locals = getLocalsTfJSON(cndi_config);
  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);

  const cndi_aws_eks_module = getCndiAWSEKSModuleTfJSON(cndi_config);
  const cndi_aws_iam_assumable_role_ebs_with_oidc_module =
    getCndiAWSIAMAssumableRoleEBSWithOIDCModuleTfJSON(cndi_config);
  const cndi_aws_iam_assumable_role_efs_with_oidc_module =
    getCndiAWSIAMAssumableRoleEFSWithOIDCModuleTfJSON(cndi_config);
  const cndi_aws_vpc_module = getCndiAWSVPCModuleTfJSON(cndi_config);

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
      path.join("cndi", "terraform", "cndi_aws_vpc_module.tf.json"),
      cndi_aws_vpc_module,
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
  ]);

  // const input: TFBlocks = {
  //   ...cndi_config?.infrastructure?.terraform,
  // };

  // // patch cndi.terraform.json with user's terraform pass-through
  // const errorPatchingAndStaging = await patchAndStageTerraformFilesWithInput(
  //   input,
  // );

  // if (errorPatchingAndStaging) return errorPatchingAndStaging;
  return null;
}
