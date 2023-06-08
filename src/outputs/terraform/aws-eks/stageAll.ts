import { ccolors, path } from "deps";

import { AWSEKSNodeItemSpec, CNDIConfig } from "src/types.ts";
import { emitExitEvent, stageFile } from "src/utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_aws_efs_access_point from "./cndi_aws_efs_access_point.tf.json.ts";
import cndi_aws_efs_mount_target_a from "./cndi_aws_efs_mount_target_a.tf.json.ts";
import cndi_aws_eip from "./cndi_aws_eip.tf.json.ts";
import cndi_aws_iam_openid_connect_provider from "./cndi_aws_iam_openid_connect_provider.tf.json.ts";
import cndi_aws_eks_cluster from "./cndi_aws_eks_cluster.tf.json.ts";
import cndi_aws_eks_node_group from "./cndi_aws_eks_node_group.tf.json.ts";
import cndi_aws_internet_gateway from "./cndi_aws_internet_gateway.tf.json.ts";
import cndi_aws_nat_gateway from "./cndi_aws_nat_gateway.tf.json.ts";
import cndi_aws_iam_role_web_identity_policy from "./cndi_aws_iam_role_web_identity_policy.tf.json.ts";
import cndi_aws_iam_policy_web_identity_policy from "./cndi_aws_iam_policy_web_identity.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_eks_cluster_policy from "./cndi_aws_iam_role_policy_attachment_eks_cluster_policy.tf.json.ts";
import cndi_aws_iam_role_eks_ec2 from "./cndi_aws_iam_role_eks_ec2.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_web_identity_policy from "./cndi_aws_iam_role_policy_attachment_web_identity_policy.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_eks_vpc_resource_controller from "./cndi_aws_iam_role_policy_attachment_eks_vpc_resource_controller.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_eks_cni_policy from "./cndi_aws_iam_role_policy_attachment_eks_cni_policy.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_eks_worker_node_policy from "./cndi_aws_iam_role_policy_attachment_eks_worker_node_policy.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_eks_service_policy from "./cndi_aws_iam_role_policy_attachment_eks_service_policy.tf.json.ts";
import cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly from "./cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly.tf.json.ts";
import cndi_aws_route_table_association_public_a from "./cndi_aws_route_table_association_public_a.tf.json.ts";
import cndi_aws_route_table_association_private_a from "./cndi_aws_route_table_association_private_a.tf.json.ts";
import cndi_aws_route_table_association_private_b from "./cndi_aws_route_table_association_private_b.tf.json.ts";
import cndi_aws_route_table_public from "./cndi_aws_route_table_public.tf.json.ts";
import cndi_aws_route_table_private from "./cndi_aws_route_table_private.tf.json.ts";
import cndi_aws_route_private from "./cndi_aws_route_private.tf.json.ts";
import cndi_aws_route_public from "./cndi_aws_route_public.tf.json.ts";
import cndi_aws_security_group from "./cndi_aws_security_group.tf.json.ts";
import cndi_aws_subnet_public_a from "./cndi_aws_subnet_public_a.tf.json.ts";
import cndi_aws_subnet_private_a from "./cndi_aws_subnet_private_a.tf.json.ts";
import cndi_aws_subnet_private_b from "./cndi_aws_subnet_private_b.tf.json.ts";
import cndi_aws_vpc from "./cndi_aws_vpc.tf.json.ts";
import cndi_aws_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";
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
import getSealedSecretsKeyYamlTftpl from "./templates/sealed_secrets_secret_manifest.yaml.tftpl.ts";
import getArgoAdminPasswordSecretManifestYamlTftpl from "./templates/argocd_admin_password_secret_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretYamlTftpl from "./templates/argocd_private_repo_secret_manifest.yaml.tftpl.ts";
import getArgoRootApplicationManifestYamlTftpl from "./templates/argocd_root_application_manifest.yaml.tftpl.ts";
export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  const aws_region = (Deno.env.get("AWS_REGION") as string) || "us-east-1";
  const project_name = config?.project_name;

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aws_eks_node_group_${node.name}.tf.json`,
      ),
      cndi_aws_eks_node_group(node as AWSEKSNodeItemSpec),
    )
  );

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
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider(),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join("cndi", "terraform", "data.tf.json"),
        data(),
      ),
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
        getArgoPrivateRepoSecretYamlTftpl(),
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
        path.join(
          "cndi",
          "terraform",
          "cndi_argocd_helm_chart.tf.json",
        ),
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
        path.join(
          "cndi",
          "terraform",
          "cndi_cert_manager_helm_chart.tf.json",
        ),
        cndi_cert_manager_helm_chart(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_ebs_driver_helm_chart.tf.json",
        ),
        cndi_ebs_driver_helm_chart(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_efs_driver_helm_chart.tf.json",
        ),
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
          "cndi_aws_internet_gateway.tf.json",
        ),
        cndi_aws_internet_gateway(),
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
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_efs_access_point.tf.json",
        ),
        cndi_aws_efs_access_point(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_efs_file_system.tf.json",
        ),
        cndi_aws_efs_file_system(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_eks_cluster_policy.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_eks_cluster_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_web_identity_policy.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_web_identity_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_policy_web_identity_policy.tf.json",
        ),
        cndi_aws_iam_policy_web_identity_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_eks_worker_node_policy.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_eks_worker_node_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_eks_vpc_resource_controller.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_eks_vpc_resource_controller(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_eks_service_policy.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_eks_service_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_policy_attachment_eks_cni_policy.tf.json",
        ),
        cndi_aws_iam_role_policy_attachment_eks_cni_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_openid_connect_provider.tf.json",
        ),
        cndi_aws_iam_openid_connect_provider(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_eks_ec2.tf.json",
        ),
        cndi_aws_iam_role_eks_ec2(),
      ),

      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_role_web_identity.tf.json",
        ),
        cndi_aws_iam_role_web_identity_policy(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_efs_mount_target_a.tf.json",
        ),
        cndi_aws_efs_mount_target_a(),
      ),

      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_eip.tf.json",
        ),
        cndi_aws_eip(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_eks_cluster.tf.json",
        ),
        cndi_aws_eks_cluster(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_iam_openid_connect_provider.tf.json",
        ),
        cndi_aws_iam_openid_connect_provider(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_nat_gateway.tf.json",
        ),
        cndi_aws_nat_gateway(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_association_public_a.tf.json",
        ),
        cndi_aws_route_table_association_public_a(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_association_private_a.tf.json",
        ),
        cndi_aws_route_table_association_private_a(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_association_private_b.tf.json",
        ),
        cndi_aws_route_table_association_private_b(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_private.tf.json",
        ),
        cndi_aws_route_table_private(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_public.tf.json",
        ),
        cndi_aws_route_table_public(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_route_private.tf.json"),
        cndi_aws_route_private(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_route_public.tf.json"),
        cndi_aws_route_public(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_security_group.tf.json",
        ),
        cndi_aws_security_group(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet_public_a.tf.json"),
        cndi_aws_subnet_public_a(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet_private_a.tf.json"),
        cndi_aws_subnet_private_a(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet_private_b.tf.json"),
        cndi_aws_subnet_private_b(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_vpc.tf.json",
        ),
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
