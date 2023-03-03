import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPComputeSubnetworkTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      google_compute_subnetwork: {
        cndi_google_compute_subnetwork: {
          ip_cidr_range: "10.0.0.0/16",
          name: "cndi-vpc-network-subnetwork",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
        },
      },
    },
  });
}
