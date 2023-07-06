import {
  getPrettyJSONString,
  getTFResource,
  getUserDataTemplateFileString,
} from "src/utils.ts";
import { AzureNodeItemSpec } from "src/types.ts";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "consts";

export default function getAzureComputeInstanceTFJSON(
  node: AzureNodeItemSpec,
  leaderNodeName: string,
): string {
  const { name, role } = node;
  const DEFAULT_IMAGE = "0001-com-ubuntu-server-focal"; // The image from which to initialize this disk
  const image = node?.image || DEFAULT_IMAGE;

  let machine_type = node?.machine_type || node?.instance_type ||
    DEFAULT_INSTANCE_TYPES.azure;

  let disk_size_gb = node?.disk_size_gb || node?.volume_size ||
    DEFAULT_NODE_DISK_SIZE;

  const leaderComputeInstance =
    `azurerm_linux_virtual_machine.cndi_azurerm_linux_virtual_machine_${leaderNodeName}`;

  // azure uses 'size' to describe the machine type, oof
  if (
    node?.size && typeof node.size === "string" && !node?.machine_type &&
    !node?.instance_type
  ) {
    machine_type = node.size;
  }

  if (node?.size && typeof node.size === "number") {
    disk_size_gb = node.size;
  }

  const resource_group_name =
    "${azurerm_resource_group.cndi_azurerm_resource_group.name}";

  const location =
    "${azurerm_resource_group.cndi_azurerm_resource_group.location}";

  const admin_username = "ubuntu";
  const admin_password = "Password123";
  const disable_password_authentication = false;

  const network_interface_ids = [
    `\${azurerm_network_interface.cndi_azurerm_network_interface_${name}.id}`,
  ];

  const zone = "1";

  const os_disk = [
    {
      name: `cndi_${name}_disk`,
      caching: "ReadWrite",
      storage_account_type: "StandardSSD_LRS",
      disk_size_gb,
    },
  ];

  const source_image_reference = [
    {
      publisher: "canonical",
      offer: image,
      sku: "20_04-lts-gen2",
      version: "latest",
    },
  ];

  const tags = {
    CNDIProject: "${local.cndi_project_name}",
  };

  const user_data = getUserDataTemplateFileString(role, true);
  const depends_on = role !== "leader" ? [leaderComputeInstance] : [];

  const resource = getTFResource(
    "azurerm_linux_virtual_machine",
    {
      admin_username,
      admin_password,
      disable_password_authentication,
      zone,
      location,
      name,
      network_interface_ids,
      os_disk,
      resource_group_name,
      size: machine_type,
      source_image_reference,
      tags,
      user_data,
      depends_on,
    },
    `cndi_azurerm_linux_virtual_machine_${node.name}`,
  );

  return getPrettyJSONString(resource);
}
