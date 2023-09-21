import { ccolors, path } from "deps";
import { AzureAKSNodeItemSpec, CNDIConfig } from "src/types.ts";
import { emitExitEvent, stageFile, useSshRepoAuth } from "src/utils.ts";
import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_azurerm_resource_group from "./cndi_azurerm_resource_group.tf.json.ts";
import cndi_azurerm_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";
import cndi_aks_cluster from "./cndi_aks_cluster.tf.json.ts";
import cndi_azurerm_public_ip_lb from "./cndi_azurerm_public_ip_lb.tf.json.ts";
import data from "./data.tf.json.ts";
import variable from "./variable.tf.json.ts";
import cndi_bcrypt_hash_argocd_admin_password from "./cndi_bcrypt_hash_argocd_admin_password.tf.json.ts";
import cndi_time_static_admin_password_update from "./cndi_time_static_admin_password_update.tf.json.ts";
import cndi_azurefile_csi_storage_class_manifest from "./cndi_azurefile_csi_storage_class_manifest.tf.json.ts";
import cndi_argocd_admin_password_secret_manifest from "./cndi_argocd_admin_password_secret_manifest.tf.json.ts";
import cndi_argocd_private_repo_secret_manifest from "./cndi_argocd_private_repo_secret_manifest.tf.json.ts";
import cndi_argocd_root_application_manifest from "./cndi_argocd_root_application_manifest.tf.json.ts";
import cndi_sealed_secrets_secret_manifest from "./cndi_sealed_secrets_secret_manifest.tf.json.ts";
import getSealedSecretsKeyYamlTftpl from "src/outputs/terraform/manifest-templates/sealed_secrets_secret_manifest.yaml.tftpl.ts";
import getStorageClassManifestYamlTftpl from "src/outputs/terraform/manifest-templates/azurefile_csi_storage_class_manifest.yaml.tftpl.ts";
import getArgoAdminPasswordSecretManifestYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_admin_password_secret_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretHTTPSYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_https_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretSSHYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_ssh_manifest.yaml.tftpl.ts";
import getArgoRootApplicationManifestYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_root_application_manifest.yaml.tftpl.ts";

import cndi_argocd_helm_chart from "./cndi_argocd_helm_chart.tf.json.ts";
import cndi_sealed_secrets_helm_chart from "./cndi_sealed_secrets_helm_chart.tf.json.ts";
import cndi_nginx_controller_helm_chart from "./cndi_nginx_controller_helm_chart.tf.json.ts";
import cndi_cert_manager_helm_chart from "./cndi_cert_manager_helm_chart.tf.json.ts";

export default async function stageTerraformResourcesForAzureAKS(
  config: CNDIConfig,
) {
  const azure_location = (Deno.env.get("ARM_REGION") as string) || "eastus";
  const privateRepoSecret = useSshRepoAuth()
    ? getArgoPrivateRepoSecretSSHYamlTftpl()
    : getArgoPrivateRepoSecretHTTPSYamlTftpl();

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join("cndi", "terraform", `cndi_aks_cluster_${node.name}.tf.json`),
      cndi_aks_cluster(node as AzureAKSNodeItemSpec),
    )
  );

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      stageFile(
        path.join("cndi", "terraform", "variable.tf.json"),
        variable(),
      ),
      stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider()),
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_azurerm_locals({ azure_location }),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_azurerm_public_ip_lb.tf.json"),
        cndi_azurerm_public_ip_lb(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_outputs.tf.json"),
        cndi_outputs(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_azurerm_resource_group.tf.json"),
        cndi_azurerm_resource_group(),
      ),
      stageFile(path.join("cndi", "terraform", "data.tf.json"), data()),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_nginx_controller_helm_chart.tf.json",
        ),
        cndi_nginx_controller_helm_chart(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_cert_manager_helm_chart.tf.json"),
        cndi_cert_manager_helm_chart(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_argocd_helm_chart.tf.json"),
        cndi_argocd_helm_chart(),
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
        privateRepoSecret,
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
          "argocd_root_application_manifest.yaml.tftpl",
        ),
        getArgoRootApplicationManifestYamlTftpl(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "azurefile_csi_storage_class_manifest.yaml.tftpl",
        ),
        getStorageClassManifestYamlTftpl(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurefile_csi_storage_class_manifest.tf.json",
        ),
        cndi_azurefile_csi_storage_class_manifest(),
      ),
    ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 808));
    await emitExitEvent(808);
    Deno.exit(808);
  }
}
