import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { AzureNodeItemSpec } from "src/types.ts";

export default function getAzureComputeInstanceTFJSON(
  node: AzureNodeItemSpec,
): string {
  const { name, role } = node;
  const DEFAULT_IMAGE = "0001-com-ubuntu-server-focal"; // The image from which to initialize this disk
  const DEFAULT_MACHINE_TYPE = "Standard_DC2s_v2"; // The machine type to create.Standard_DC2s_v2 has 2cpu and 8g of ram
  const DEFAULT_SIZE = 130; // The size of the image in gigabytes\
  const image = node?.image || DEFAULT_IMAGE;
  let machine_type = node?.machine_type || node?.instance_type ||
    DEFAULT_MACHINE_TYPE;
  let disk_size_gb = node?.disk_size_gb || node?.volume_size || DEFAULT_SIZE;
  const leaderComputeInstance =
    "azurerm_linux_virtual_machine.cndi_azurerm_linux_virtual_machine_${local.leader_node_name}";
  if (node?.size && typeof node.size === "string") {
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
    cndi_project_name: "${local.cndi_project_name}",
  };

  const leader_user_data =
    '${base64encode(templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${var.git_repo}", "git_password": "${var.git_password}", "git_username": "${var.git_username}", "sealed_secrets_private_key": "${var.sealed_secrets_private_key}", "sealed_secrets_public_key": "${var.sealed_secrets_public_key}", "argo_ui_admin_password": "${var.argo_ui_admin_password}" }))}';
  const controller_user_data =
    '${base64encode(templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"}))}';

  const user_data = role === "leader" ? leader_user_data : controller_user_data;
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
