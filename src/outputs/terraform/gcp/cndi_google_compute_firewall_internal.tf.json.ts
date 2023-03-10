import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeFirewallInternalTFJSON(): string {
  const resource = getTFResource(
    "google_compute_firewall",
    {
      allow: [
        {
          ports: ["0-65535"],
          protocol: "tcp",
        },
        {
          ports: ["0-65535"],
          protocol: "udp",
        },
        {
          protocol: "icmp",
        },
      ],
      description:
        "Inbound rule that enables traffic between EC2 instances in the VPC",
      direction: "INGRESS",
      name: "cndi-allow-internal-traffic",
      network: "${google_compute_network.cndi_google_compute_network.self_link}",
      source_ranges: [
        "${google_compute_subnetwork.cndi_google_compute_subnetwork.ip_cidr_range}",
      ],
    },
    "cndi_google_compute_firewall_internal",
  );
  return getPrettyJSONString(resource);
}
