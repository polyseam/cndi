import {
  getPrettyJSONString,
  getTFResource,
  getLeaderNodeNameFromConfig,
} from "src/utils.ts";
import { GCPNodeItemSpec, CNDIConfig } from "../../../types.ts";

export default function getGCPComputeInstanceTFJSON(
  node: GCPNodeItemSpec,
  config: CNDIConfig
): string {

  const DEFAULT_IMAGE = "ubuntu-2004-focal-v20221121"; // The image from which to initialize this disk
  const DEFAULT_MACHINE_TYPE = "n2-standard-2"; // The machine type to create.
  const DEFAULT_SIZE = 100; // The size of the disk in gigabytes

  const { name, role } = node;
  const image = node?.image || DEFAULT_IMAGE;
  const machine_type =
    node?.machine_type || node?.instance_type || DEFAULT_MACHINE_TYPE;
  const size = node?.size || node?.volume_size || DEFAULT_SIZE;

  const leaderNodeName = getLeaderNodeNameFromConfig(config);

  const allow_stopping_for_update = true; // If true, allows Terraform to stop the instance to update its properties.

  const type = "pd-ssd"; //  The GCE disk type. Such as pd-standard, pd-balanced or pd-ssd.
  const network_tier = "STANDARD";
  const network =
    "${google_compute_network.cndi_google_compute_network.self_link}"; //The name of the network to attach this interface to.
  const subnetwork =
    "${google_compute_subnetwork.cndi_google_compute_subnetwork.self_link}"; //The name or self_link of the subnetwork to attach this interface to.

  const access_config = [{ network_tier }]; //Access config that set whether the instance can be accessed via the Internet. Omitting = not accessible from the Internet.
  const source = `\${google_compute_disk.cndi_google_compute_disk_${name}.self_link}`;

  const leaderComputeInstance = `cndi_google_compute_instance_${leaderNodeName}`;

  const boot_disk = [
    {
      source,
    },
  ];

  const network_interface = [
    {
      access_config,
      network,
      subnetwork,
    },
  ];

  const leader_user_data =
    '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_admin_password": "${local.argo_ui_admin_password}" })}';
  const controller_user_data =
    '${templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"})}';

  const user_data = role === "leader" ? leader_user_data : controller_user_data;
  const depends_on = role !== "leader" ? [leaderComputeInstance] : [];

  const computeInstanceResource = getTFResource(
    "google_compute_instance",
    {
      allow_stopping_for_update,
      boot_disk,
      depends_on,
      machine_type,
      metadata: {
        "user-data": user_data,
      },
      name: name,
      network_interface,
      tags: [name],
    },
    `cndi_google_compute_instance_${node.name}`
  ).resource;

  const computeDiskResource = getTFResource(
    "google_compute_disk",
    {
      name: `${name}-cndi-disk`,
      image,
      size,
      type,
      depends_on: ["google_project_service.cndi_google_project_service_compute"],
    },
    `cndi_google_compute_disk_${node.name}`
  ).resource;

  return getPrettyJSONString({
    resource: {
      ...computeInstanceResource,
      ...computeDiskResource,
    },
  });
}
