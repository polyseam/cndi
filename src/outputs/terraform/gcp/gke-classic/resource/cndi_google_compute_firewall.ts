import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface GoogleAllowEntry {
  protocol: string;
  ports?: string[];
}

interface GOOGLE_COMPUTE_FIREWALL {
  depends_on: string[];
  direction: "INGRESS" | "EGRESS";
  name: string;
  description: string;
  network: string;
  source_ranges: string[];
  allow: GoogleAllowEntry[];
}

export default function (_cndi_config: CNDIConfig) {
  const google_compute_firewall: Record<string, GOOGLE_COMPUTE_FIREWALL> = {
    cndi_google_compute_firewall: {
      allow: [
        {
          protocol: "icmp",
        },
        {
          protocol: "tcp",
          ports: ["0-65535"],
        },
        {
          protocol: "udp",
          ports: ["0-65535"],
        },
      ],
      description: "Allow all inside the cluster",
      direction: "INGRESS",
      network:
        "${google_compute_network.cndi_google_compute_network.self_link}",
      name: "cndi-compute-firewall-allow-internal-${local.cndi_project_name}",
      source_ranges: [
        "${google_compute_subnetwork.cndi_google_compute_subnetwork.ip_cidr_range}",
      ],
      depends_on: ["timesleep.cndi_time_sleep_services_ready"],
    },
  };

  return getPrettyJSONString({
    resource: {
      google_compute_firewall,
    },
  });
}
