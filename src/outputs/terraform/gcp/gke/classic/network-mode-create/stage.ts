import { CNDIConfig } from "src/types.ts";
import { path } from "deps";
import {} from "versions";

import {
  stageFile,
  // useSshRepoAuth,
} from "src/utils.ts";

import getDataTfJSON from "./data.tf.json.ts";

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

// GKE Classic Terraform Modules
import getCndiGoogleProjectServicesModuleTfJSON from "./module/cndi_google_project_services.tf.json.ts";

// GKE Classic Terraform Kubernetes Resources
import cndi_kubernetes_storage_class from "./resource/cndi_kubernetes_storage_class.tf.json.ts";

// GKE Classic Terraform Resources
import cndi_google_compute_network from "./resource/cndi_google_compute_network.tf.json.ts";
import cndi_google_compute_subnetwork from "./resource/cndi_google_compute_subnetwork.tf.json.ts";
import cndi_google_container_cluster from "./resource/cndi_google_container_cluster.tf.json.ts";
import cndi_google_container_node_pool from "./resource/cndi_google_container_node_pool.tf.json.ts";
import cndi_google_compute_firewall from "./resource/cndi_google_compute_firewall.tf.json.ts";
import cndi_time_sleep from "./resource/cndi_time_sleep.tf.json.ts";

export async function stageGCPGKEClassicNetworkModeCreateTerraformFiles(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const data = getDataTfJSON(cndi_config);
  const locals = getLocalsTfJSON(cndi_config);
  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);

  await Promise.all([
    stageFile(path.join("cndi", "terraform", "data.tf.json"), data),
    stageFile(path.join("cndi", "terraform", "locals.tf.json"), locals),
    stageFile(path.join("cndi", "terraform", "output.tf.json"), output),
    stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider),
    stageFile(path.join("cndi", "terraform", "variable.tf.json"), variable),
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_google_project_services_module.tf.json",
      ),
      getCndiGoogleProjectServicesModuleTfJSON(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_google_compute_network.tf.json"),
      cndi_google_compute_network(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_google_compute_subnetwork.tf.json"),
      cndi_google_compute_subnetwork(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_google_container_cluster.tf.json"),
      cndi_google_container_cluster(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_google_container_node_pool.tf.json"),
      cndi_google_container_node_pool(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_google_compute_firewall.tf.json"),
      cndi_google_compute_firewall(cndi_config),
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
    stageFile(
      path.join("cndi", "terraform", "cndi_time_sleep.tf.json"),
      cndi_time_sleep(cndi_config),
    ),
  ]);

  return null;
}
