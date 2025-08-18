import { ErrOut } from "errout";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageFile } from "src/utils.ts";
import { path } from "deps";

import getTerraformTfJSON from "src/outputs/terraform/shared/terraform.ts";
import getProviderTfJSON from "src/outputs/terraform/shared/provider.tf.json.ts";
import getVariableTfJSON from "src/outputs/terraform/shared/variable.tf.json.ts";
import getOutputTfJSON from "src/outputs/terraform/shared/output.tf.json.ts";
import getLocalsTfJSON from "src/outputs/terraform/shared/locals.tf.json.ts";

// Core Terraform Insert Mode Blocks
import getDataTfJSON from "./shared/data.tf.json.ts";
import getBareLocals from "./shared/locals.tf.json.ts";

// Shared Kubernetes Terraform Resources
import cndi_helm_release_argocd from "src/outputs/terraform/shared/resource/cndi_helm_release_argocd.tf.json.ts";
import cndi_helm_release_argocd_apps from "src/outputs/terraform/shared/resource/cndi_helm_release_argocd_apps.tf.json.ts";
import cndi_helm_release_sealed_secrets from "src/outputs/terraform/shared/resource/cndi_helm_release_sealed_secrets.tf.json.ts";
import cndi_kubernetes_secret_sealed_secrets_key from "src/outputs/terraform/shared/resource/cndi_kubernetes_secret_sealed_secrets_key.tf.json.ts";
import cndi_kubernetes_secret_argocd_private_repo from "src/outputs/terraform/shared/resource/cndi_kubernetes_secret_argocd_private_repo.tf.json.ts";
import cndi_time_static_argocd_admin_password from "src/outputs/terraform/shared/resource/cndi_time_static_argocd_admin_password.tf.json.ts";
import cndi_kubernetes_storage_class from "src/outputs/terraform/aws/eks/classic/shared/resource/cndi_kubernetes_storage_class.tf.json.ts";

// Import resources
import cndi_null_resource_k3s_leader_install from "./shared/resource/cndi_null_resource_k3s_leader_install.tf.json.ts";
import cndi_null_resource_k3s_cluster_info from "./shared/resource/cndi_null_resource_k3s_cluster_info.tf.json.ts";
import cndi_null_resource_k3s_worker_install from "./shared/resource/cndi_null_resource_k3s_worker_install.tf.json.ts";
import cndi_local_file_ssh_private_key from "./shared/resource/cndi_local_file_ssh_private_key.tf.json.ts";
import cndi_local_file_final_kubeconfig from "./shared/resource/cndi_local_file_final_kubeconfig.tf.json.ts";

/**
 * Stages Terraform files for classic k3s deployment
 */
export async function stageK3sClassicTerraform(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);
  const data = getDataTfJSON(cndi_config);
  const locals = getLocalsTfJSON(cndi_config, getBareLocals(cndi_config));

  await Promise.all([
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform),
    stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider),
    stageFile(path.join("cndi", "terraform", "variable.tf.json"), variable),
    stageFile(path.join("cndi", "terraform", "output.tf.json"), output),
    stageFile(path.join("cndi", "terraform", "data.tf.json"), data),
    stageFile(path.join("cndi", "terraform", "locals.tf.json"), locals),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_null_resource_k3s_leader_install.tf.json",
      ),
      cndi_null_resource_k3s_leader_install(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_null_resource_k3s_cluster_info.tf.json",
      ),
      cndi_null_resource_k3s_cluster_info(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_null_resource_k3s_worker_install.tf.json",
      ),
      cndi_null_resource_k3s_worker_install(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_local_file_ssh_private_key.tf.json"),
      cndi_local_file_ssh_private_key(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_local_file_final_kubeconfig.tf.json",
      ),
      cndi_local_file_final_kubeconfig(cndi_config),
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
