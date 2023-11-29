import { getPrettyJSONString, getTFResource } from "src/utils.ts";
import { CNDIPort } from "src/types.ts";

type GCPFirewallAllowItem = {
  protocol: "tcp";
  ports: string[];
};

export default function getGCPComputeFirewallExternalTFJSON(
  ports: Array<CNDIPort>,
): string {
  const allow: GCPFirewallAllowItem[] = ports.map(({ number }) => ({
    protocol: "tcp",
    ports: [`${number}`],
  }));

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
