import { getPrettyJSONString } from "src/utils.ts";

export default function getGCPComputeNetworkTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      google_compute_network: {
        cndi_google_compute_network: {
          auto_create_subnetworks: false,
          name: "cndi-vpc-network",
          depends_on: ["google_project_service.cndi_enable_compute_service"],
        },
      },
    },
  });
}
