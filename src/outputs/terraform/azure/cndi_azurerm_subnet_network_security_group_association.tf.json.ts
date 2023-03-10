import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAzureSubnetNetworkSecurityGroupAssociationTFJSON(): string {
  const resource = getTFResource(
    "azurerm_subnet_network_security_group_association",
    {
      subnet_id: "${azurerm_subnet.cndi_azurerm_subnet.id}",
      network_security_group_id:
        "${azurerm_network_security_group.cndi_azurerm_network_security_group.id}",
    },
  );
  return getPrettyJSONString(resource);
}
