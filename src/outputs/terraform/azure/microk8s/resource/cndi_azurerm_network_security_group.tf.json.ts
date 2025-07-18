import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: NormalizedCNDIConfig) {
  const azurerm_network_security_group = {
    cndi_azure_subnet_nsg: {
      location:
        "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
      name: "cndi-azure-subnet-nsg",
      resource_group_name:
        "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
      security_rule: [
        // Allow SSH
        {
          access: "Allow",
          destination_address_prefix: "*",
          destination_port_range: "22",
          direction: "Inbound",
          name: "ssh",
          priority: 100,
          protocol: "Tcp",
          source_address_prefix: "*",
          source_port_range: "*",
        },
        // Allow HTTP
        {
          access: "Allow",
          destination_address_prefix: "*",
          destination_port_range: "80",
          direction: "Inbound",
          name: "http",
          priority: 110,
          protocol: "Tcp",
          source_address_prefix: "*",
          source_port_range: "*",
        },
        // Allow HTTPS
        {
          access: "Allow",
          destination_address_prefix: "*",
          destination_port_range: "443",
          direction: "Inbound",
          name: "https",
          priority: 120,
          protocol: "Tcp",
          source_address_prefix: "*",
          source_port_range: "*",
        },
        // Allow Kubernetes API server
        {
          access: "Allow",
          destination_address_prefix: "*",
          destination_port_range: "6443",
          direction: "Inbound",
          name: "kubernetes-api",
          priority: 130,
          protocol: "Tcp",
          source_address_prefix: "*",
          source_port_range: "*",
        },
      ],
      tags: {
        CNDIProject: "${local.cndi_project_name}",
      },
    },
  };

  return getPrettyJSONString({ resource: { azurerm_network_security_group } });
}
