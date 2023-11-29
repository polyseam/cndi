import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeSubnetworkTFJSON(): string {
  const resource = getTFResource("google_compute_subnetwork", {
    ip_cidr_range: "10.0.0.0/16",
    name: "cndi-vpc-network-subnetwork",
    network: "${google_compute_network.cndi_google_compute_network.self_link}",
  });
  return getPrettyJSONString(resource);
}
