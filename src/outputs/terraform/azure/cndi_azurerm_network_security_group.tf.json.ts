import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";
export default function getAzureNetworkSecurityGroupTFJSON(
  ports: Array<CNDIPort>,
): string {
  const rules = [
    {
      access: "Allow",
      description: "Allow inbound SSH traffic",
      destination_address_prefix: "*",
      destination_address_prefixes: [],
      destination_application_security_group_ids: [],
      destination_port_range: "22",
      destination_port_ranges: [],
      direction: "Inbound",
      name: "AllowSSH",
      priority: 200,
      protocol: "Tcp",
      source_address_prefix: "*",
      source_address_prefixes: [],
      source_application_security_group_ids: [],
      source_port_range: "*",
      source_port_ranges: [],
    },
    {
      access: "Allow",
      description: "Allow inbound for HTTP traffic",
      destination_address_prefix: "*",
      destination_address_prefixes: [],
      destination_application_security_group_ids: [],
      destination_port_range: "80",
      destination_port_ranges: [],
      direction: "Inbound",
      name: "AllowHTTP",
      priority: 220,
      protocol: "Tcp",
      source_address_prefix: "*",
      source_address_prefixes: [],
      source_application_security_group_ids: [],
      source_port_range: "*",
      source_port_ranges: [],
    },
    {
      access: "Allow",
      description: "Allow inbound for HTTPS traffic",
      destination_address_prefix: "*",
      destination_address_prefixes: [],
      destination_application_security_group_ids: [],
      destination_port_range: "443",
      destination_port_ranges: [],
      direction: "Inbound",
      name: "AllowHTTPS",
      priority: 210,
      protocol: "Tcp",
      source_address_prefix: "*",
      source_address_prefixes: [],
      source_application_security_group_ids: [],
      source_port_range: "*",
      source_port_ranges: [],
    },
    {
      access: "Allow",
      description: "Allow inbound for k8s API server",
      destination_address_prefix: "*",
      destination_address_prefixes: [],
      destination_application_security_group_ids: [],
      destination_port_range: "16443",
      destination_port_ranges: [],
      direction: "Inbound",
      name: "AllowKubeAccess",
      priority: 230,
      protocol: "Tcp",
      source_address_prefix: "*",
      source_address_prefixes: [],
      source_application_security_group_ids: [],
      source_port_range: "*",
      source_port_ranges: [],
    },
  ];

  ports.forEach((port, index) => {
    const { number, name, disable } = port;
    if (disable) {
      const portToRemove = rules.findIndex((item) =>
        item.destination_port_range === `${number}`
      );
      if (portToRemove > -1) {
        rules.splice(portToRemove, 1);
      }
    } else {
      rules.push({
        access: "Allow",
        description: `Allow inbound for ${name} on ${number}`,
        destination_address_prefix: "*",
        destination_address_prefixes: [],
        destination_application_security_group_ids: [],
        destination_port_range: `${port.number}`,
        destination_port_ranges: [],
        direction: "Inbound",
        name: `Allow_${name}`,
        priority: parseInt(`10${index}`),
        protocol: "Tcp",
        source_address_prefix: "*",
        source_address_prefixes: [],
        source_application_security_group_ids: [],
        source_port_range: "*",
        source_port_ranges: [],
      });
    }
  });

  const resource = getTFResource("azurerm_network_security_group", {
    location: "${azurerm_resource_group.cndi_azurerm_resource_group.location}",
    name: "cndi_azurerm_network_security_group",
    resource_group_name:
      "${azurerm_resource_group.cndi_azurerm_resource_group.name}",
    security_rule: rules,
    tags: { CNDIProject: "${local.cndi_project_name}" },
  });
  return getPrettyJSONString(resource);
}
