import { getPrettyJSONString } from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

interface GoogleAllowEntry {
  protocol: string;
  ports?: string[];
}

interface GoogleComputeFirewall {
  direction: "INGRESS" | "EGRESS";
  name: string;
  description: string;
  network: string;
  source_ranges: string[];
  allow: GoogleAllowEntry[];
}

export default function (_cndi_config: NormalizedCNDIConfig) {
  const google_compute_firewall: Record<string, GoogleComputeFirewall> = {
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
    },
  };

  return getPrettyJSONString({
    resource: {
      google_compute_firewall,
    },
  });
}
