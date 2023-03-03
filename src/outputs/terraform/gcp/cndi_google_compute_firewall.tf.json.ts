import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPComputeFirewallTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      google_compute_firewall: {
        cndi_google_compute_firewall: {
          allow: [
            {
              ports: ["22"],
              protocol: "tcp",
            },
            {
              ports: ["80"],
              protocol: "tcp",
            },
            {
              ports: ["443"],
              protocol: "tcp",
            },
            {
              ports: ["30000-33000"],
              protocol: "tcp",
            },
          ],
          description: "Security firewall",
          direction: "INGRESS",
          name: "cndi-allow-external-traffic",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
          source_ranges: ["0.0.0.0/0"],
        },
        cndi_allow_internal_traffic: {
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
          network: "${google_compute_network.cndi_vpc_network.self_link}",
          source_ranges: [
            "${google_compute_subnetwork.cndi_vpc_subnetwork.ip_cidr_range}",
          ],
        },
      },
    },
  });
}
