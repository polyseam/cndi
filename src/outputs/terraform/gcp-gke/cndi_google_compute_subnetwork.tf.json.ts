import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeSubnetworkTFJSON(): string {
  const resource = getTFResource("google_compute_subnetwork", {
    ip_cidr_range: "10.0.0.0/16",
    name: "cndi-vpc-network-subnetwork",
    network: "${google_compute_network.cndi_google_compute_network.self_link}",
    private_ip_google_access: true,
    secondary_ip_range: [
      {
        ip_cidr_range: "10.48.0.0/14",
        range_name: "k8s-pod-range",
      },
      {
        ip_cidr_range: "10.52.0.0/20",
        range_name: "k8s-service-range",
      },
    ],
  });
  return getPrettyJSONString(resource);
}
