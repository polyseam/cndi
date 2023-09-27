import { ccolors, path } from "deps";

import { AWSEKSNodeItemSpec, CNDIConfig } from "src/types.ts";
import {
  emitExitEvent,
  resolveCNDIPorts,
  stageFile,
  useSshRepoAuth,
} from "src/utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_aws_efs_access_point from "./cndi_aws_efs_access_point.tf.json.ts";
import cndi_aws_efs_mount_target_a from "./cndi_aws_efs_mount_target_a.tf.json.ts";
import cndi_aws_eks_cluster from "./cndi_aws_eks_cluster.tf.json.ts";
import cndi_aws_iam_role_ec2 from "./cndi_aws_iam_role_ec2.tf.json.ts";
import cndi_aws_iam_role_eks from "./cndi_aws_iam_role_eks.tf.json.ts";
import cndi_aws_iam_role_web_identity from "./cndi_aws_iam_role_web_identity.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_web_identity from "./cndi_aws_iam_role_policy_attachment_web_identity.tf.json.ts";
import cndi_aws_vpc from "./cndi_aws_vpc.tf.json.ts";
import cndi_aws_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";
import cndi_aws_security_group from "./cndi_aws_security_group.tf.json.ts";
import cndi_aws_resourcegroups_group from "./cndi_aws_resourcegroups_group.tf.json.ts";
import cndi_bcrypt_hash_argocd_admin_password from "./cndi_bcrypt_hash_argocd_admin_password.tf.json.ts";
import cndi_time_static_admin_password_update from "./cndi_time_static_admin_password_update.tf.json.ts";
import cndi_aws_efs_file_system from "./cndi_aws_efs_file_system.tf.json.ts";
import cndi_argocd_admin_password_secret_manifest from "./cndi_argocd_admin_password_secret_manifest.tf.json.ts";
import cndi_argocd_private_repo_secret_manifest from "./cndi_argocd_private_repo_secret_manifest.tf.json.ts";
import cndi_argocd_root_application_manifest from "./cndi_argocd_root_application_manifest.tf.json.ts";
import cndi_sealed_secrets_secret_manifest from "./cndi_sealed_secrets_secret_manifest.tf.json.ts";
import cndi_nginx_controller_helm_chart from "./cndi_nginx_controller_helm_chart.tf.json.ts";
import cndi_argocd_helm_chart from "./cndi_argocd_helm_chart.tf.json.ts";
import cndi_cert_manager_helm_chart from "./cndi_cert_manager_helm_chart.tf.json.ts";
import cndi_ebs_driver_helm_chart from "./cndi_ebs_driver_helm_chart.tf.json.ts";
import cndi_efs_driver_helm_chart from "./cndi_efs_driver_helm_chart.tf.json.ts";
import cndi_sealed_secrets_helm_chart from "./cndi_sealed_secrets_helm_chart.tf.json.ts";
import data from "./data.tf.json.ts";
import getSealedSecretsKeyYamlTftpl from "src/outputs/terraform/manifest-templates/sealed_secrets_secret_manifest.yaml.tftpl.ts";
import getArgoAdminPasswordSecretManifestYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_admin_password_secret_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretHTTPSYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_https_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretSSHYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_ssh_manifest.yaml.tftpl.ts";
import getArgoRootApplicationManifestYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_root_application_manifest.yaml.tftpl.ts";
export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  const aws_region = (Deno.env.get("AWS_REGION") as string) || "us-east-1";
  const project_name = config?.project_name;

  const ports = resolveCNDIPorts(config);

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aws_eks_cluster${node.name}.tf.json`,
      ),
      cndi_aws_eks_cluster(node as AWSEKSNodeItemSpec),
    )
  );

  const privateRepoSecret = useSshRepoAuth()
    ? getArgoPrivateRepoSecretSSHYamlTftpl()
    : getArgoPrivateRepoSecretHTTPSYamlTftpl();

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_resourcegroups_group.tf.json"),
        cndi_aws_resourcegroups_group(project_name),
      ),
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_aws_locals({
          aws_region,
        }),
      ),
      stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider()),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(path.join("cndi", "terraform", "data.tf.json"), data()),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "argocd_admin_password_secret_manifest.yaml.tftpl",
        ),
        getArgoAdminPasswordSecretManifestYamlTftpl(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "argocd_private_repo_secret_manifest.yaml.tftpl",
        ),
        privateRepoSecret,
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "argocd_root_application_manifest.yaml.tftpl",
        ),
        getArgoRootApplicationManifestYamlTftpl(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_outputs.tf.json"),
        cndi_outputs(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "sealed_secrets_secret_manifest.yaml.tftpl",
        ),
        getSealedSecretsKeyYamlTftpl(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_argocd_admin_password_secret_manifest.tf.json",
        ),
        cndi_argocd_admin_password_secret_manifest(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_sealed_secrets_secret_manifest.tf.json",
        ),
        cndi_sealed_secrets_secret_manifest(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_argocd_private_repo_secret_manifest.tf.json",
        ),
        cndi_argocd_private_repo_secret_manifest(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_argocd_root_application_manifest.tf.json",
        ),
        cndi_argocd_root_application_manifest(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_argocd_helm_chart.tf.json"),
        cndi_argocd_helm_chart(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_sealed_secrets_helm_chart.tf.json",
        ),
        cndi_sealed_secrets_helm_chart(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_cert_manager_helm_chart.tf.json"),
        cndi_cert_manager_helm_chart(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_ebs_driver_helm_chart.tf.json"),
        cndi_ebs_driver_helm_chart(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_efs_driver_helm_chart.tf.json"),
        cndi_efs_driver_helm_chart(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_nginx_controller_helm_chart.tf.json",
        ),
        cndi_nginx_controller_helm_chart(),
      ),

      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_time_static_admin_password_update.tf.json",
        ),
        cndi_time_static_admin_password_update(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_bcrypt_hash_argocd_admin_password.tf.json",
        ),
        cndi_bcrypt_hash_argocd_admin_password(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_iam_role_ec2.tf.json"),
        cndi_aws_iam_role_ec2(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_iam_role_eks.tf.json"),
        cndi_aws_iam_role_eks(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_efs_access_point.tf.json"),
        cndi_aws_efs_access_point(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_efs_file_system.tf.json"),
        cndi_aws_efs_file_system(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_web_identity.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_web_identity(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_security_group.tf.json"),
        cndi_aws_security_group(ports),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_web_identity.tf.json",
        ),
        cndi_aws_iam_role_web_identity(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_efs_mount_target_a.tf.json"),
        cndi_aws_efs_mount_target_a(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_vpc.tf.json"),
        cndi_aws_vpc(),
      ),
    ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 806));
    await emitExitEvent(806);
    Deno.exit(806);
  }
}
