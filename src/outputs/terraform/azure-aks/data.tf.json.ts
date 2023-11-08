import { getPrettyJSONString } from "src/utils.ts";

export default function getAKSDataTFJSON(): string {
  return getPrettyJSONString({
    data: {
      azurerm_public_ips: {
        public: {
          name_prefix: "kubernetes",
          resource_group_name:
            "${azurerm_resource_group.cndi_azurerm_resource_group.name}-resources",
          depends_on: [
            "helm_release.cndi_nginx_controller_helm_chart_public",
          ],
        },
      },
      azurerm_lb: {
        private: {
          name: "kubernetes-internal",
          resource_group_name:
            "${azurerm_resource_group.cndi_azurerm_resource_group.name}-resources",
          depends_on: [
            "helm_release.cndi_nginx_controller_helm_chart_private",
          ],
        },
      },
      template_file: {
        azurefile_csi_storage_class_manifest: {
          template:
            '${file("azurefile_csi_storage_class_manifest.yaml.tftpl")}',
        },
        azuredisk_csi_storage_class_manifest: {
          template:
            '${file("azuredisk_csi_storage_class_manifest.yaml.tftpl")}',
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
