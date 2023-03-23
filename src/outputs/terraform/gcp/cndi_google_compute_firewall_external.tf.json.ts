import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeFirewallExternalTFJSON(): string {
  const resource = getTFResource(
    "google_compute_firewall",
    {
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
      network:
        "${google_compute_network.cndi_google_compute_network.self_link}",
      source_ranges: ["0.0.0.0/0"],
    },
    "cndi_google_compute_firewall_external",
  );
  return getPrettyJSONString(resource);
}
