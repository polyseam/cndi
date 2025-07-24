import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (cndi_config: NormalizedCNDIConfig) {
  
  if(cndi_config.infrastructure.cndi.nodes === "auto") {
    console.error(
      "src/outputs/terraform/azure/microk8s/resource/cndi_azurerm_linux_virtual_machine.tf.json.ts",
      "Nodes cannot be 'auto' in Azure MicroK8s mode.",
    );
    throw new Error("Nodes cannot be 'auto' in Azure MicroK8s mode.");
  }

  const nodeConfig = cndi_config.infrastructure?.cndi?.nodes?.[0] || {};
  const vmSize = nodeConfig.machine_type || nodeConfig.instance_type ||
    "Standard_D2s_v3";
  const diskSizeGb = nodeConfig.disk_size_gb || nodeConfig.volume_size || 100;

  // deno-lint-ignore ban-types
  const azurerm_linux_virtual_machine: Record<string, {}> = {};

  for (const n of cndi_config.infrastructure?.cndi?.nodes || []) {
    const nodeName = `cndi_azurerm_linux_virtual_machine_${n.name}`;

    azurerm_linux_virtual_machine[nodeName] = {
      admin_username: "ubuntu",
      admin_ssh_key: [
        {
          public_key: "${var.SSH_PUBLIC_KEY}",
          username: "ubuntu",
        },
      ],
      disable_password_authentication: true,
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      name: `cndi-azure-vm-${n.name || "xnodegroup_0"}`,
      network_interface_ids: [
        "${azurerm_network_interface.cndi_azure_network_interface_xnodegroup_0.id}",
      ],
      os_disk: {
        caching: "ReadWrite",
        disk_size_gb: diskSizeGb,
        name: `cndi-disk-${n.name || "xnodegroup_0"}`,
        storage_account_type: "StandardSSD_LRS",
      },
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      size: vmSize,
      source_image_reference: {
        offer: "0001-com-ubuntu-server-jammy",
        publisher: "canonical",
        sku: "22_04-lts-gen2",
        version: "latest",
      },
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
      // zone: n.zone || "1",
      custom_data: `\${base64encode(
        templatefile(
          "\${path.module}/templates/microk8s-cloud-init-leader.yml.tftpl",
          {
            bootstrap_token = random_password.cndi_join_token.result,
            git_repo = var.GIT_REPO,
            git_token = var.GIT_TOKEN,
            git_username = var.GIT_USERNAME,
            sealed_secrets_private_key = base64encode(var.SEALED_SECRETS_PRIVATE_KEY),
            sealed_secrets_public_key = base64encode(var.SEALED_SECRETS_PUBLIC_KEY),
            argocd_admin_password = var.ARGOCD_ADMIN_PASSWORD,
          }
        )
      )}`,
      depends_on: [
        "azurerm_network_interface_backend_address_pool_association.cndi_azure_lb_backend_address_pool_association_xnodegroup_0",
      ],
    };
  }

  return getPrettyJSONString({ resource: { azurerm_linux_virtual_machine } });
}
