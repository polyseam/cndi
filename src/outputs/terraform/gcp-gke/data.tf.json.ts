import { getPrettyJSONString } from "src/utils.ts";

export default function getGKEDataTFJSON(): string {
  return getPrettyJSONString({
    data: {
      google_client_config: {
        cndi_google_client_config: {},
      },
      template_file: {
        firestore_csi_storage_class_manifest: {
          template:
            '${file("firestore_csi_storage_class_manifest.yaml.tftpl")}',
        },
        argocd_private_repo_secret_manifest: {
          template: '${file("argocd_private_repo_secret_manifest.yaml.tftpl")}',
          vars: {
            git_password: "${var.git_password}",
            git_repo: "${var.git_repo}",
            git_username: "${var.git_username}",
          },
        },
        sealed_secrets_secret_manifest: {
          template: '${file("sealed_secrets_secret_manifest.yaml.tftpl")}',
          vars: {
            sealed_secret_cert_pem:
              "${base64encode(var.sealed_secrets_public_key)}",
            sealed_secret_private_key_pem:
              "${base64encode(var.sealed_secrets_private_key)}",
          },
        },
        argocd_root_application_manifest: {
          template: '${file("argocd_root_application_manifest.yaml.tftpl")}',
          vars: {
            git_repo: "${var.git_repo}",
          },
        },
        argocd_admin_password_secret_manifest: {
          template:
            '${file("argocd_admin_password_secret_manifest.yaml.tftpl")}',
          vars: {
            admin_password_time:
              '${time_static.cndi_time_static_admin_password_update.id}")}',
            argocd_admin_password:
              "${bcrypt_hash.cndi_bcrypt_hash_argocd_admin_password.id}",
          },
        },
      },
    },
  });
}
