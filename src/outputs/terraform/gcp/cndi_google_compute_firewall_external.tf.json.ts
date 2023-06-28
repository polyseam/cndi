import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

export default function getGCPComputeFirewallExternalTFJSON(
  ports: Array<CNDIPort>,
): string {
  const allow = [
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
  ];

  ports.forEach((port) => {
    if (port.disable) {
      const portToRemove = allow.findIndex((item) =>
        item.ports.includes(`${port.number}`)
      );
      if (portToRemove > -1) {
        allow.splice(portToRemove, 1);
      }
    } else {
      allow.push({
        protocol: "tcp",
        ports: [`${port.number}`],
      });
    }
  });

  const resource = getTFResource(
    "google_compute_firewall",
    {
      allow,
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
