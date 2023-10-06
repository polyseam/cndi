import {
  getPrettyJSONString,
  getTFResource,
  getUserDataTemplateFileString,
} from "src/utils.ts";
import { GCPNodeItemSpec } from "src/types.ts";

export default function getGCPComputeInstanceTFJSON(
  node: GCPNodeItemSpec,
  leaderNodeName: string,
): string {
  const { name, role } = node;
  const DEFAULT_MACHINE_TYPE = "n2-standard-2"; // The machine type to create.
  const machine_type = node?.machine_type || node?.instance_type ||
    DEFAULT_MACHINE_TYPE;
  const allow_stopping_for_update = true; // If true, allows Terraform to stop the instance to update its properties.
  const network_tier = "STANDARD";
  const network =
    "${google_compute_network.cndi_google_compute_network.self_link}"; //network to attach this interface to.
  const subnetwork =
    "${google_compute_subnetwork.cndi_google_compute_subnetwork.self_link}"; //subnetwork to attach this interface to.
  const access_config = [{ network_tier }]; //Access config that set whether the instance can be accessed via the Internet. Omitting = not accessible from the Internet.
  const source =
    `\${google_compute_disk.cndi_google_compute_disk_${name}.self_link}`;
  const leaderComputeInstance =
    `google_compute_instance.cndi_google_compute_instance_${leaderNodeName}`;
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

  const user_data = getUserDataTemplateFileString({
    role,
    node_hostname: name,
  });
  const depends_on = role !== "leader" ? [leaderComputeInstance] : [];

  const resource = getTFResource(
    "google_compute_instance",
    {
      allow_stopping_for_update,
      boot_disk,
      depends_on,
      machine_type,
      metadata: {
        "user-data": user_data,
      },
      name,
      network_interface,
      tags: [name],
    },
    `cndi_google_compute_instance_${node.name}`,
  ).resource;

  return getPrettyJSONString({ resource });
}
