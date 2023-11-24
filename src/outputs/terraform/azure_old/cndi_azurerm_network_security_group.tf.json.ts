import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";
type AzureSecurityGroupRule = {
  access: "Allow" | "Deny";
  description: string;
  destination_address_prefix: string;
  destination_address_prefixes: Array<string>;
  destination_application_security_group_ids: Array<string>;
  destination_port_range: string;
  destination_port_ranges: Array<string>;
  direction: "Inbound" | "Outbound";
  name: string;
  priority: number;
  protocol: "Tcp";
  source_address_prefix: string;
  source_address_prefixes: Array<string>;
  source_application_security_group_ids: Array<string>;
  source_port_range: string;
  source_port_ranges: Array<string>;
};
export default function getAzureNetworkSecurityGroupTFJSON(
  ports: Array<CNDIPort>,
): string {
  const rules: AzureSecurityGroupRule[] = ports.map((
    { name, number },
    index,
  ) => ({
    access: "Allow",
    description: `Allow inbound for ${name} on ${number}`,
    destination_address_prefix: "*",
    destination_address_prefixes: [],
    destination_application_security_group_ids: [],
    destination_port_range: `${number}`,
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
  }));

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
