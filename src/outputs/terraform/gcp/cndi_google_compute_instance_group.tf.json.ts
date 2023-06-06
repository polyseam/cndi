import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort, GCPNodeItemSpec } from "src/types.ts";

export default function getGCPComputeInstanceGroupTFJSON(
  nodes: Array<GCPNodeItemSpec>,
  user_ports: Array<CNDIPort>,
): string {
  const instances = nodes.map((node) => {
    return `\${google_compute_instance.cndi_google_compute_instance_${node.name}.self_link}`;
  });

  const named_port = [
    {
      name: "http",
      port: "80",
    },
    {
      name: "https",
      port: "443",
    },
  ];

  user_ports.forEach((port) => {
    named_port.push({
      name: `${port.name}`,
      port: `${port.number}`,
    });
  });

  const resource = getTFResource("google_compute_instance_group", {
    description: "group of instances that form a cndi cluster",
    instances,
    name: "cndi-cluster",
    named_port,
    zone: "${local.gcp_zone}",
  });

  return getPrettyJSONString(resource);
}
