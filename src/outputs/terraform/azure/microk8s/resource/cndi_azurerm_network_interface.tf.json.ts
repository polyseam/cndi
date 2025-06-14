import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_network_interface = {
    cndi_azure_network_interface_xnodegroup_0: {
      enable_ip_forwarding: true,
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      name: "cndi-azure-nic-xnodegroup-0",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      ip_configuration: [
        {
          name: "internal",
          private_ip_address_allocation: "Dynamic",
          subnet_id: "${azurerm_subnet.cndi_azure_subnet.id}",
        },
      ],
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_network_interface } });
}
