import { ccolors, path } from "deps";

import { CNDIConfig, GKENodeItemSpec } from "src/types.ts";
import { emitExitEvent, stageFile, useSshRepoAuth } from "src/utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_google_compute_address from "./cndi_google_compute_address.tf.json.ts";
import cndi_google_compute_network from "./cndi_google_compute_network.tf.json.ts";
import cndi_gke_cluster from "./cndi_gke_cluster.tf.json.ts";
import cndi_google_compute_subnetwork from "./cndi_google_compute_subnetwork.tf.json.ts";
import cndi_google_project_service_k8s from "./cndi_google_project_service_k8s.tf.json.ts";
import cndi_google_project_service_compute from "./cndi_google_project_service_compute.tf.json.ts";
import cndi_google_project_service_file from "./cndi_google_project_service_file.tf.json.ts";
import cndi_google_project_service_cloudresourcemanager from "./cndi_google_project_service_cloudresourcemanager.tf.json.ts";
import cndi_google_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";
import cndi_bcrypt_hash_argocd_admin_password from "./cndi_bcrypt_hash_argocd_admin_password.tf.json.ts";
import cndi_time_static_admin_password_update from "./cndi_time_static_admin_password_update.tf.json.ts";
import data from "./data.tf.json.ts";
import cndi_argocd_admin_password_secret_manifest from "./cndi_argocd_admin_password_secret_manifest.tf.json.ts";
import cndi_argocd_private_repo_secret_manifest from "./cndi_argocd_private_repo_secret_manifest.tf.json.ts";
import cndi_argocd_root_application_manifest from "./cndi_argocd_root_application_manifest.tf.json.ts";
import cndi_sealed_secrets_secret_manifest from "./cndi_sealed_secrets_secret_manifest.tf.json.ts";
import cndi_filestore_csi_storage_class_manifest from "./cndi_filestore_csi_storage_class_manifest.tf.json.ts";
import getStorageClassManifestYamlTftpl from "src/outputs/terraform/manifest-templates/filestore_csi_storage_class_manifest.yaml.tftpl.ts";
import getSealedSecretsKeyYamlTftpl from "src/outputs/terraform/manifest-templates/sealed_secrets_secret_manifest.yaml.tftpl.ts";
import getArgoAdminPasswordSecretManifestYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_admin_password_secret_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretHTTPSYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_https_manifest.yaml.tftpl.ts";
import getArgoPrivateRepoSecretSSHYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_private_repo_secret_ssh_manifest.yaml.tftpl.ts";
import getArgoRootApplicationManifestYamlTftpl from "src/outputs/terraform/manifest-templates/argocd_root_application_manifest.yaml.tftpl.ts";
import cndi_argocd_helm_chart from "./cndi_argocd_helm_chart.tf.json.ts";
import cndi_sealed_secrets_helm_chart from "./cndi_sealed_secrets_helm_chart.tf.json.ts";
import cndi_nginx_controller_helm_chart from "./cndi_nginx_controller_helm_chart.tf.json.ts";
import cndi_cert_manager_helm_chart from "./cndi_cert_manager_helm_chart.tf.json.ts";
import cndi_google_compute_firewall_internal from "./cndi_google_compute_firewall_internal.tf.json.ts";

const gcpStageAllLable = ccolors.faded(
  "\nsrc/outputs/terraform/gcp-gke/stageAll.ts:",
);

export default async function stageTerraformResourcesForGCPGKE(
  config: CNDIConfig,
  options: { output: string; initializing: boolean },
) {
  const privateRepoSecret = useSshRepoAuth()
    ? getArgoPrivateRepoSecretSSHYamlTftpl()
    : getArgoPrivateRepoSecretHTTPSYamlTftpl();

  const dotEnvPath = path.join(options.output, ".env");
  const gcp_region = (Deno.env.get("GCP_REGION") as string) || "us-central1";
  const googleCredentials = Deno.env.get("GOOGLE_CREDENTIALS") as string; // project_id
  if (!googleCredentials) {
    console.error(
      gcpStageAllLable,
      ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
      ccolors.error("is not set in your environment"),
    );
    console.log(
      ccolors.error(
        "You need to set it to the contents of your service account key json file\n",
      ),
    );
    // the message about missing credentials should have already been printed
    await emitExitEvent(803);
    Deno.exit(803);
  }

  // we parse the key to extract the project_id for use in terraform
  // the json key is only used for auth within `cndi run`
  let parsedJSONServiceAccountKey = { project_id: "" };
  let parsedJSONServiceAccountClientEmail = { client_email: "" };
  try {
    parsedJSONServiceAccountKey = JSON.parse(googleCredentials);
    parsedJSONServiceAccountClientEmail = JSON.parse(googleCredentials);
  } catch (parsingError) {
    const placeholder = "GOOGLE_CREDENTIALS_PLACEHOLDER__";
    if (googleCredentials === placeholder) {
      console.log(
        gcpStageAllLable,
        ccolors.error("ERROR:"),
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.warn("not found in environment"),
      );
      console.log(
        ccolors.warn("You need to replace"),
        ccolors.key_name(placeholder),
        ccolors.warn(
          "with the contents of your service account key json file in",
        ),
        ccolors.user_input(`"${dotEnvPath}"`),
        ccolors.warn("\nthen run"),
        ccolors.success("cndi ow\n"),
      );
      if (!options.initializing) {
        console.log();
        await emitExitEvent(804);
        Deno.exit(804);
      }
    } else {
      console.error(
        ccolors.error("failed to parse service account key json from"),
        ccolors.user_input(`"${dotEnvPath}"`),
      );
      console.log(ccolors.caught(parsingError, 805));
      await emitExitEvent(805);
      Deno.exit(805);
    }
  }

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_gke_cluster_${node.name}.tf.json`,
      ),
      cndi_gke_cluster(node as GKENodeItemSpec),
    )
  );

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_google_locals({
          gcp_region,
          project_id: parsedJSONServiceAccountKey.project_id,
          client_email: parsedJSONServiceAccountClientEmail.client_email,
        }),
      ),
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_outputs.tf.json"),
        cndi_outputs(),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(path.join("cndi", "terraform", "data.tf.json"), data()),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_project_service_compute.tf.json",
        ),
        cndi_google_project_service_compute(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_project_service_cloudresourcemanager.tf.json",
        ),
        cndi_google_project_service_cloudresourcemanager(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_project_service_k8s.tf.json",
        ),
        cndi_google_project_service_k8s(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_project_service_file.tf.json",
        ),
        cndi_google_project_service_file(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_google_compute_network.tf.json"),
        cndi_google_compute_network(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_subnetwork.tf.json",
        ),
        cndi_google_compute_subnetwork(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_address.tf.json",
        ),
        cndi_google_compute_address(),
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
          "cndi_cert_manager_helm_chart.tf.json",
        ),
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
          "filestore_csi_storage_class_manifest.yaml.tftpl",
        ),
        getStorageClassManifestYamlTftpl(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_filestore_csi_storage_class_manifest.tf.json",
        ),
        cndi_filestore_csi_storage_class_manifest(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_firewall_internal.tf.json",
        ),
        cndi_google_compute_firewall_internal(),
      ),
    ]);
  } catch (e) {
    console.log(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 802));
    await emitExitEvent(802);
    Deno.exit(802);
  }
}
